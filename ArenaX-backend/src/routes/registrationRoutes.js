const express = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/authmiddleware");
const { getRegistrationStatus } = require("../utils/registrationTimeline");

const router = express.Router();

/**
 * POST /api/registrations
 * Team captain registers their team for a published tournament.
 * body: { tournament_id, team_id }
 */
router.post("/", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { tournament_id, team_id } = req.body;

    if (!tournament_id || !team_id) {
        return res.status(400).json({
            error: "TOURNAMENT ID AND TEAM ID ARE REQUIRED"
        });
    }

    const tournamentSql = `
        SELECT t.tournament_id, t.game_id, t.status, t.registration_start_at, t.registration_end_at,
               (SELECT COUNT(*) FROM TOURNAMENT_STAGE ts WHERE ts.tournament_id = t.tournament_id AND ts.group_generation_status != 'not_generated') AS active_group_stages
        FROM TOURNAMENT t WHERE t.tournament_id = ?
    `;

    db.query(tournamentSql, [tournament_id], (err, tournamentResults) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO VALIDATE TOURNAMENT"
            });
        }

        if (tournamentResults.length === 0) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND"
            });
        }

        const tournament = tournamentResults[0];

        const regStatus = getRegistrationStatus(tournament, tournament.active_group_stages);

        if (regStatus === "NOT_STARTED") {
            return res.status(400).json({
                error: "REGISTRATION HAS NOT STARTED YET",
                code: "REGISTRATION_NOT_STARTED"
            });
        }

        if (regStatus === "CLOSED") {
            return res.status(400).json({
                error: "REGISTRATION DEADLINE HAS PASSED OR REGISTRATION IS CLOSED",
                code: "REGISTRATION_CLOSED"
            });
        }

        if (regStatus === "FROZEN") {
            return res.status(409).json({
                error: "REGISTRATION IS FROZEN - GROUPS HAVE ALREADY BEEN GENERATED FOR THIS TOURNAMENT",
                code: "REGISTRATION_FROZEN"
            });
        }

        if (regStatus !== "OPEN") {
            return res.status(400).json({
                error: `TOURNAMENT IS NOT OPEN FOR REGISTRATION (CURRENT STATUS: '${tournament.status}')`,
                code: "REGISTRATION_CLOSED"
            });
        }

        // Verify the logged-in user is the captain of this team, and get the team's game_id
        const teamSql = `
            SELECT t.team_id, t.game_id, ga.user_id AS captain_user_id
            FROM TEAM t
            JOIN GAME_ACCOUNT ga ON t.captain_id = ga.account_id
            WHERE t.team_id = ?
        `;

        db.query(teamSql, [team_id], (err, teamResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "FAILED TO VALIDATE TEAM"
                });
            }

            if (teamResults.length === 0) {
                return res.status(404).json({
                    error: "TEAM NOT FOUND"
                });
            }

            const team = teamResults[0];

            if (team.captain_user_id !== userId) {
                return res.status(403).json({
                    error: "ONLY THE TEAM CAPTAIN CAN REGISTER THIS TEAM"
                });
            }

            if (team.game_id !== tournament.game_id) {
                return res.status(400).json({
                    error: "THIS TEAM'S GAME DOES NOT MATCH THE TOURNAMENT'S GAME"
                });
            }

            const insertSql = `
                INSERT INTO REGISTRATION (tournament_id, team_id, status)
                VALUES (?, ?, 'pending')
            `;

            db.query(insertSql, [tournament_id, team_id], (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({
                            error: "THIS TEAM IS ALREADY REGISTERED FOR THIS TOURNAMENT"
                        });
                    }
                    console.error(err);
                    return res.status(500).json({
                        error: "FAILED TO REGISTER TEAM"
                    });
                }

                return res.status(201).json({
                    message: "REGISTRATION SUBMITTED SUCCESSFULLY",
                    registrationId: result.insertId
                });
            });
        });
    });
});

/**
 * GET /api/registrations/my
 * Captain-only. Shows the registration status of teams the logged-in
 * user captains, across all tournaments.
 */
router.get("/my", requireAuth, (req, res) => {
    const userId = req.session.userId;

    const sql = `
        SELECT DISTINCT
            r.registration_id,
            r.status,
            r.seed_number,
            r.registered_at,
            r.approved_at,
            t.tournament_id,
            t.name AS tournament_name,
            tm.team_id,
            tm.team_name
        FROM REGISTRATION r
        JOIN TOURNAMENT t ON r.tournament_id = t.tournament_id
        JOIN TEAM tm ON r.team_id = tm.team_id
        LEFT JOIN GAME_ACCOUNT ga ON tm.captain_id = ga.account_id
        LEFT JOIN TEAM_MEMBER tmem ON tm.team_id = tmem.team_id AND tmem.role = 'captain'
        LEFT JOIN GAME_ACCOUNT ga_mem ON tmem.game_account_id = ga_mem.account_id
        WHERE ga.user_id = ? OR ga_mem.user_id = ?
        ORDER BY r.registered_at DESC
    `;

    db.query(sql, [userId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO FETCH YOUR REGISTRATIONS"
            });
        }

        return res.status(200).json({
            registrations: results
        });
    });
});

/**
 * GET /api/registrations/tournament/:tournamentId
 * Organizer-only, owner-only. Lists every registration submitted for
 * one of the organizer's own tournaments.
 */
router.get("/tournament/:tournamentId", requireAuth, requireRole("organizer"), async (req, res) => {
    const tournamentId = req.params.tournamentId;
    const organizerId = req.session.userId;

    try {
        const [ownerResults] = await db.promise().query(
            `SELECT organizer_id FROM TOURNAMENT WHERE tournament_id = ?`,
            [tournamentId]
        );

        if (ownerResults.length === 0) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND"
            });
        }

        if (ownerResults[0].organizer_id !== organizerId) {
            return res.status(403).json({
                error: "YOU DO NOT OWN THIS TOURNAMENT"
            });
        }

        const [regResults] = await db.promise().query(
            `SELECT
                r.registration_id,
                r.status,
                r.seed_number,
                r.registered_at,
                r.approved_at,
                tm.team_id,
                tm.team_name,
                tm.team_tag
            FROM REGISTRATION r
            JOIN TEAM tm ON r.team_id = tm.team_id
            WHERE r.tournament_id = ?
            ORDER BY r.registered_at ASC`,
            [tournamentId]
        );

        if (regResults.length === 0) {
            return res.status(200).json({
                registrations: []
            });
        }

        const teamIds = regResults.map((r) => r.team_id);

        const [memberResults] = await db.promise().query(
            `SELECT
                tm.team_id,
                tm.member_id,
                tm.role,
                tm.assigned_role,
                tm.is_substitute,
                tm.is_active,
                ga.account_id AS game_account_id,
                ga.game_username,
                ga.game_uid,
                u.user_id,
                u.username
            FROM TEAM_MEMBER tm
            JOIN GAME_ACCOUNT ga ON tm.game_account_id = ga.account_id
            JOIN USER u ON ga.user_id = u.user_id
            WHERE tm.team_id IN (?)
            ORDER BY FIELD(tm.role, 'captain', 'player', 'substitute'), tm.is_substitute ASC, tm.is_active DESC`,
            [teamIds]
        );

        const membersByTeam = {};
        for (const m of memberResults) {
            if (!membersByTeam[m.team_id]) {
                membersByTeam[m.team_id] = [];
            }
            membersByTeam[m.team_id].push({
                user_id: m.user_id,
                username: m.username,
                game_account_id: m.game_account_id,
                game_username: m.game_username,
                game_uid: m.game_uid,
                role: m.role,
                assigned_role: m.assigned_role,
                is_substitute: Boolean(m.is_substitute),
                is_active: Boolean(m.is_active)
            });
        }

        const registrationsWithRoster = regResults.map((r) => ({
            ...r,
            roster: membersByTeam[r.team_id] || []
        }));

        return res.status(200).json({
            registrations: registrationsWithRoster
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "FAILED TO FETCH REGISTRATIONS"
        });
    }
});

/**
 * POST /api/registrations/:id/approve
 * Organizer-only, owner-only. Approves a pending registration.
 */
router.post("/:id/approve", requireAuth, requireRole("organizer"), (req, res) => {
    handleApproval(req, res, "approved");
});

/**
 * POST /api/registrations/:id/reject
 * Organizer-only, owner-only. Rejects a pending registration.
 */
router.post("/:id/reject", requireAuth, requireRole("organizer"), (req, res) => {
    handleApproval(req, res, "rejected");
});

function handleApproval(req, res, newStatus) {
    const registrationId = req.params.id;
    const organizerId = req.session.userId;

    const sql = `
        SELECT r.registration_id, r.tournament_id, r.status, t.organizer_id,
               (SELECT COUNT(*) FROM TOURNAMENT_STAGE ts WHERE ts.tournament_id = r.tournament_id AND ts.group_generation_status != 'not_generated') AS active_group_stages
        FROM REGISTRATION r
        JOIN TOURNAMENT t ON r.tournament_id = t.tournament_id
        WHERE r.registration_id = ?
    `;

    db.query(sql, [registrationId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO VALIDATE REGISTRATION"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "REGISTRATION NOT FOUND"
            });
        }

        const registration = results[0];

        if (registration.organizer_id !== organizerId) {
            return res.status(403).json({
                error: "YOU DO NOT OWN THIS TOURNAMENT"
            });
        }

        if (registration.active_group_stages > 0) {
            return res.status(409).json({
                error: "CANNOT CHANGE REGISTRATION STATUS - GROUPS HAVE ALREADY BEEN GENERATED FOR THIS TOURNAMENT",
                code: "STATE_CONFLICT"
            });
        }

        if (registration.status === newStatus) {
            return res.status(400).json({
                error: `REGISTRATION IS ALREADY '${registration.status}'`
            });
        }

        const updateSql = `
            UPDATE REGISTRATION
            SET status = ?, approved_at = ${newStatus === "approved" ? "CURRENT_TIMESTAMP" : "NULL"}
            WHERE registration_id = ?
        `;

        db.query(updateSql, [newStatus, registrationId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "FAILED TO UPDATE REGISTRATION"
                });
            }

            return res.status(200).json({
                message: `REGISTRATION ${newStatus.toUpperCase()}`
            });
        });
    });
}

module.exports = router;