const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/teams/my
 * Get all teams associated with the logged-in user.
 */
router.get("/my", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const sql = `
    SELECT
        t.team_id,
        t.team_name,
        t.team_tag,
        t.status,
        t.captain_id,
        ga.account_id,
        g.game_name,
        tm.role,
        tm.is_substitute,
        tm.is_active,
        CASE WHEN tm.role = 'captain' OR t.captain_id = ga.account_id THEN 1 ELSE 0 END AS is_captain
    FROM TEAM_MEMBER tm
    JOIN TEAM t
        ON tm.team_id = t.team_id
    JOIN GAME_ACCOUNT ga
        ON tm.game_account_id = ga.account_id
    JOIN GAME g
        ON t.game_id = g.game_id
    WHERE ga.user_id = ?
    ORDER BY t.created_at DESC
`;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO FETCH MY TEAMS"
            });
        }

        return res.status(200).json({
            teams: results
        });
    });
});

/**
 * GET /api/teams/recruiting
 * Browse teams currently looking for starting/main-roster players.
 * Must be placed BEFORE /:id route so Express does not interpret "recruiting" as an ID.
 * Filters: game_id, search (team_name or team_tag).
 */
router.get("/recruiting", requireAuth, (req, res) => {
    const { game_id, search } = req.query;

    let sql = `
        SELECT
            t.team_id,
            t.team_name,
            t.team_tag,
            t.game_id,
            g.game_name,
            t.status,
            captain_ga.game_username AS captain_username,
            COUNT(CASE WHEN tm.is_active = TRUE AND tm.is_substitute = FALSE THEN 1 END) AS active_member_count,
            (5 - COUNT(CASE WHEN tm.is_active = TRUE AND tm.is_substitute = FALSE THEN 1 END)) AS open_slots
        FROM TEAM t
        JOIN GAME g ON t.game_id = g.game_id
        JOIN GAME_ACCOUNT captain_ga ON t.captain_id = captain_ga.account_id
        LEFT JOIN TEAM_MEMBER tm ON t.team_id = tm.team_id
        WHERE t.status = 'forming'
    `;

    const queryParams = [];

    if (game_id) {
        sql += ` AND t.game_id = ?`;
        queryParams.push(game_id);
    }

    if (search) {
        sql += ` AND (t.team_name LIKE ? OR t.team_tag LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    sql += `
        GROUP BY t.team_id, t.team_name, t.team_tag, t.game_id, g.game_name, t.status, captain_ga.game_username
        HAVING active_member_count < 5
        ORDER BY t.created_at DESC
    `;

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO FETCH RECRUITING TEAMS"
            });
        }

        return res.status(200).json({
            teams: results
        });
    });
});

/**
 * GET /api/teams/:id
 * Get details and members for a specific team.
 */
router.get("/:id", requireAuth, (req, res) => {
    const teamId = req.params.id;
    const sql = `
    SELECT
        t.team_id,
        t.team_name,
        t.team_tag,
        t.status,
        g.game_name,
        ga.account_id,
        ga.game_username,
        tm.role,
        tm.assigned_role,
        tm.is_substitute,
        tm.is_active,
        fa.preferred_role
    FROM TEAM t
    JOIN GAME g
        ON t.game_id = g.game_id
    JOIN TEAM_MEMBER tm
        ON t.team_id = tm.team_id
    JOIN GAME_ACCOUNT ga
        ON tm.game_account_id = ga.account_id
    LEFT JOIN FREE_AGENT_PROFILE fa
        ON ga.account_id = fa.game_account_id
    WHERE t.team_id = ?
    ORDER BY tm.role = 'captain' DESC, tm.is_substitute ASC;
`;
    db.query(sql, [teamId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO FETCH TEAM"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "TEAM NOT FOUND"
            });
        }

        const team = {
            team_id: results[0].team_id,
            team_name: results[0].team_name,
            team_tag: results[0].team_tag,
            status: results[0].status,
            game_name: results[0].game_name,
            members: []
        };
        results.forEach((row) => {
            team.members.push({
                account_id: row.account_id,
                game_username: row.game_username,
                role: row.role,
                assigned_role: row.assigned_role || row.preferred_role || null,
                preferred_role: row.preferred_role || null,
                is_substitute: row.is_substitute,
                is_active: row.is_active
            });
        });
        return res.status(200).json({
            team: team
        });
    });
});

/**
 * POST /api/teams
 * Create a new team with captain assignment and free-agent profile deactivation.
 */
router.post("/", requireAuth, (req, res) => {
    const userId = req.session.userId;

    const { game_id, team_name, team_tag } = req.body;

    if (!game_id || !team_name || !team_tag) {
        return res.status(400).json({
            error: "GAME ID, TEAM NAME, AND TEAM TAG ARE REQUIRED"
        });
    }

    // Find the logged-in user's game account for this game
    const captainCheckSql = `
        SELECT account_id
        FROM GAME_ACCOUNT
        WHERE user_id = ? AND game_id = ?
        LIMIT 1
    `;

    db.query(captainCheckSql, [userId, game_id], (err, captainResults) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO CHECK CAPTAIN GAME ACCOUNT"
            });
        }

        if (captainResults.length === 0) {
            return res.status(400).json({
                error: "YOU MUST HAVE A GAME ACCOUNT FOR THIS GAME"
            });
        }

        const captainId = captainResults[0].account_id;

        // FIX: Verify this game account is not already an active member
        // (or captain) of ANY team. Without this, a player could end up
        // captaining/joining multiple teams at once, which every other
        // route (applications, invitations, free agents) already blocks -
        // team creation was the one gap.
        const activeElsewhereCheckSql = `
            SELECT member_id
            FROM TEAM_MEMBER
            WHERE game_account_id = ? AND is_active = TRUE
        `;

        db.query(activeElsewhereCheckSql, [captainId], (err, activeResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "FAILED TO CHECK EXISTING TEAM MEMBERSHIP"
                });
            }

            if (activeResults.length > 0) {
                return res.status(400).json({
                    error: "THIS GAME ACCOUNT IS ALREADY AN ACTIVE MEMBER OF ANOTHER TEAM"
                });
            }

            // Start transaction
            db.beginTransaction((err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        error: "FAILED TO START TEAM CREATION"
                    });
                }

                // Insert team
                const insertTeamSql = `
                    INSERT INTO TEAM (
                        game_id,
                        captain_id,
                        team_name,
                        team_tag,
                        status
                    )
                    VALUES (?, ?, ?, ?, 'forming')
                `;

                db.query(insertTeamSql, [game_id, captainId, team_name, team_tag], (err, teamResults) => {
                    if (err) {
                        console.error(err);
                        return db.rollback(() => {
                            res.status(500).json({
                                error: "FAILED TO CREATE TEAM"
                            });
                        });
                    }

                    const teamId = teamResults.insertId;

                    // Insert captain into TEAM_MEMBER
                    const insertCaptainSql = `
                        INSERT INTO TEAM_MEMBER (
                            team_id,
                            game_account_id,
                            role,
                            is_substitute,
                            is_active
                        )
                        VALUES (?, ?, 'captain', FALSE, TRUE)
                    `;

                    db.query(insertCaptainSql, [teamId, captainId], (err) => {
                        if (err) {
                            console.error(err);
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: "FAILED TO ADD CAPTAIN TO TEAM"
                                });
                            });
                        }

                        // Update captain's free agent profile to unavailable if exists
                        const updateFaSql = `
                            UPDATE FREE_AGENT_PROFILE
                            SET availability_status = 'unavailable'
                            WHERE game_account_id = ?
                        `;

                        db.query(updateFaSql, [captainId], (err) => {
                            if (err) console.error(err);

                            const updateGaSql = `
                                UPDATE GAME_ACCOUNT
                                SET is_free_agent = FALSE
                                WHERE account_id = ?
                            `;

                            db.query(updateGaSql, [captainId], (err) => {
                                if (err) console.error(err);

                                db.commit((err) => {
                                    if (err) {
                                        console.error(err);
                                        return db.rollback(() => {
                                            res.status(500).json({
                                                error: "FAILED TO COMPLETE TEAM CREATION"
                                            });
                                        });
                                    }

                                    return res.status(201).json({
                                        message: "TEAM CREATED SUCCESSFULLY",
                                        teamId: teamId
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

/**
 * DELETE /api/teams/:id
 * Disband / Delete a team. Only team captain is authorized.
 */
router.delete("/:id", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const teamId = req.params.id;

    // Check if team exists and verify logged-in user is captain of the team
    const checkSql = `
        SELECT t.team_id, t.captain_id, ga.user_id AS captain_user_id
        FROM TEAM t
        JOIN GAME_ACCOUNT ga ON t.captain_id = ga.account_id
        WHERE t.team_id = ?
    `;

    db.query(checkSql, [teamId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO VERIFY TEAM CAPTAIN"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "TEAM NOT FOUND"
            });
        }

        if (results[0].captain_user_id !== userId) {
            return res.status(403).json({
                error: "ONLY THE TEAM CAPTAIN CAN DISBAND THIS TEAM"
            });
        }

        // Delete the team. Foreign keys with ON DELETE CASCADE will clean up TEAM_MEMBER, TEAM_INVITATION, TEAM_APPLICATION, REGISTRATION.
        const deleteSql = `DELETE FROM TEAM WHERE team_id = ?`;

        db.query(deleteSql, [teamId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "FAILED TO DISBAND TEAM"
                });
            }

            return res.status(200).json({
                message: "TEAM DISBANDED SUCCESSFULLY"
            });
        });
    });
});

/**
 * PUT /api/teams/:id/members/:accountId/role
 * Switch / Assign role slot to a team member. Only team captain can perform this.
 */
router.put("/:id/members/:accountId/role", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const teamId = req.params.id;
    const targetAccountId = req.params.accountId;
    const { assigned_role } = req.body;

    const VALID_ROLES = ["Marksman", "Clashlaner", "Jungler", "Roam", "Midlaner"];
    if (assigned_role && !VALID_ROLES.includes(assigned_role)) {
        return res.status(400).json({
            error: "INVALID ROLE SLOT. MUST BE ONE OF: Marksman, Clashlaner, Jungler, Roam, Midlaner"
        });
    }

    // Verify captain authorization
    const captainCheckSql = `
        SELECT t.team_id, t.captain_id, ga.user_id AS captain_user_id
        FROM TEAM t
        JOIN GAME_ACCOUNT ga ON t.captain_id = ga.account_id
        WHERE t.team_id = ?
    `;

    db.query(captainCheckSql, [teamId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "FAILED TO VERIFY CAPTAIN AUTHORIZATION" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "TEAM NOT FOUND" });
        }

        if (results[0].captain_user_id !== userId) {
            return res.status(403).json({ error: "ONLY THE TEAM CAPTAIN CAN SWITCH MEMBER ROLES" });
        }

        // Check if member belongs to team
        const memberCheckSql = `
            SELECT member_id FROM TEAM_MEMBER
            WHERE team_id = ? AND game_account_id = ?
        `;

        db.query(memberCheckSql, [teamId, targetAccountId], (err, memberResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "FAILED TO VERIFY TEAM MEMBER" });
            }

            if (memberResults.length === 0) {
                return res.status(404).json({ error: "MEMBER NOT FOUND IN THIS TEAM" });
            }

            // Update assigned_role
            const updateSql = `
                UPDATE TEAM_MEMBER
                SET assigned_role = ?
                WHERE team_id = ? AND game_account_id = ?
            `;

            db.query(updateSql, [assigned_role || null, teamId, targetAccountId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "FAILED TO UPDATE MEMBER ROLE" });
                }

                return res.status(200).json({
                    message: "PLAYER ROLE SLOT UPDATED SUCCESSFULLY",
                    assigned_role: assigned_role || null
                });
            });
        });
    });
});

/**
 * DELETE /api/teams/:id/members/:accountId
 * Remove a player from the team. Only team captain can perform this.
 */
router.delete("/:id/members/:accountId", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const teamId = req.params.id;
    const targetAccountId = req.params.accountId;

    // 1. Verify captain authorization
    const captainCheckSql = `
        SELECT t.team_id, t.captain_id, ga.user_id AS captain_user_id
        FROM TEAM t
        JOIN GAME_ACCOUNT ga ON t.captain_id = ga.account_id
        WHERE t.team_id = ?
    `;

    db.query(captainCheckSql, [teamId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "FAILED TO VERIFY CAPTAIN AUTHORIZATION" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "TEAM NOT FOUND" });
        }

        const team = results[0];

        if (team.captain_user_id !== userId) {
            return res.status(403).json({ error: "ONLY THE TEAM CAPTAIN CAN REMOVE MEMBERS" });
        }

        // Prevent captain from removing themselves
        if (String(team.captain_id) === String(targetAccountId)) {
            return res.status(400).json({ error: "CAPTAIN CANNOT BE REMOVED FROM THE TEAM. DISBAND THE TEAM INSTEAD." });
        }

        // 2. Check if member exists in team
        const memberCheckSql = `
            SELECT member_id, role, is_substitute
            FROM TEAM_MEMBER
            WHERE team_id = ? AND game_account_id = ?
        `;

        db.query(memberCheckSql, [teamId, targetAccountId], (err, memberResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "FAILED TO VERIFY TEAM MEMBER" });
            }

            if (memberResults.length === 0) {
                return res.status(404).json({ error: "MEMBER NOT FOUND IN THIS TEAM" });
            }

            db.beginTransaction((err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "FAILED TO START TRANSACTION" });
                }

                // Delete member from TEAM_MEMBER
                const deleteMemberSql = `
                    DELETE FROM TEAM_MEMBER
                    WHERE team_id = ? AND game_account_id = ?
                `;

                db.query(deleteMemberSql, [teamId, targetAccountId], (err) => {
                    if (err) {
                        console.error(err);
                        return db.rollback(() => {
                            res.status(500).json({ error: "FAILED TO REMOVE MEMBER FROM TEAM" });
                        });
                    }

                    // Check remaining main roster count and update team status to 'forming' if < 5
                    const capacitySql = `
                        SELECT COUNT(CASE WHEN is_substitute = FALSE AND is_active = TRUE THEN 1 END) AS active_main
                        FROM TEAM_MEMBER
                        WHERE team_id = ?
                    `;

                    db.query(capacitySql, [teamId], (err, capacityResults) => {
                        if (err) console.error(err);

                        const activeMain = capacityResults[0]?.active_main || 0;
                        const updateTeamStatusSql = activeMain < 5
                            ? `UPDATE TEAM SET status = 'forming' WHERE team_id = ?`
                            : `SELECT 1`;

                        db.query(updateTeamStatusSql, [teamId], (err) => {
                            if (err) console.error(err);

                            // Set player's FREE_AGENT_PROFILE availability to 'available' if exists
                            const updateFaSql = `
                                UPDATE FREE_AGENT_PROFILE
                                SET availability_status = 'available'
                                WHERE game_account_id = ?
                            `;

                            db.query(updateFaSql, [targetAccountId], (err) => {
                                if (err) console.error(err);

                                const updateGaSql = `
                                    UPDATE GAME_ACCOUNT
                                    SET is_free_agent = TRUE
                                    WHERE account_id = ?
                                `;

                                db.query(updateGaSql, [targetAccountId], (err) => {
                                    if (err) console.error(err);

                                    db.commit((err) => {
                                        if (err) {
                                            console.error(err);
                                            return db.rollback(() => {
                                                res.status(500).json({ error: "FAILED TO COMMIT TRANSACTION" });
                                            });
                                        }

                                        return res.status(200).json({
                                            message: "PLAYER REMOVED FROM TEAM SUCCESSFULLY"
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;