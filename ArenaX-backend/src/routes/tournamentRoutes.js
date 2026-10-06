const express = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/authmiddleware");
const { getRegistrationStatus, normalizeTimestamp } = require("../utils/registrationTimeline");
const { validatePrizePool } = require("../utils/prizePoolValidator");

const router = express.Router();

// Only these two formats are allowed (matches TOURNAMENT.format ENUM in the DB)
const VALID_FORMATS = ["single_elimination", "double_elimination"];

// Allowed forward-only lifecycle transitions (matches TOURNAMENT.status ENUM in the DB)
const VALID_STATUS_TRANSITIONS = {
    draft: ["published"],
    published: ["live"],
    live: ["completed"],
    completed: []
};

/**
 * GET /api/tournaments
 * Public browse list — only shows tournaments that are actually announced
 * (published, live, or completed). Draft tournaments are intentionally
 * excluded here so unfinished/unpublished tournaments never leak publicly.
 * Filters: game_id, status
 */
router.get("/", requireAuth, (req, res) => {
    const { game_id, status } = req.query;

    let sql = `
        SELECT
            t.tournament_id,
            t.name,
            t.format,
            t.status,
            t.registration_start_at,
            t.registration_end_at,
            t.prize_pool_usd,
            t.created_at,
            g.game_id,
            g.game_name,
            u.user_id AS organizer_id,
            u.username AS organizer_username,
            (SELECT COUNT(*) FROM TOURNAMENT_STAGE ts WHERE ts.tournament_id = t.tournament_id AND ts.group_generation_status != 'not_generated') AS active_group_stages
        FROM TOURNAMENT t
        JOIN GAME g ON t.game_id = g.game_id
        JOIN USER u ON t.organizer_id = u.user_id
        WHERE t.status IN ('published', 'live', 'completed')
    `;

    const queryParams = [];

    if (game_id) {
        sql += ` AND t.game_id = ?`;
        queryParams.push(game_id);
    }

    if (status) {
        if (!["published", "live", "completed"].includes(status)) {
            return res.status(400).json({
                error: "INVALID STATUS FILTER"
            });
        }
        sql += ` AND t.status = ?`;
        queryParams.push(status);
    }

    sql += ` ORDER BY t.created_at DESC`;

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO FETCH TOURNAMENTS"
            });
        }

        const enriched = results.map((t) => ({
            ...t,
            prize_pool_usd: t.prize_pool_usd !== null ? Number(t.prize_pool_usd) : null,
            registration_status: getRegistrationStatus(t, t.active_group_stages)
        }));

        return res.status(200).json({
            tournaments: enriched
        });
    });
});

/**
 * GET /api/tournaments/my
 * Organizer-only. Returns every tournament created by the logged-in
 * organizer, including drafts. Must be declared BEFORE "/:id" so Express
 * does not treat "my" as a tournament id.
 */
router.get("/my", requireAuth, requireRole("organizer"), (req, res) => {
    const organizerId = req.session.userId;

    const sql = `
        SELECT
            t.tournament_id,
            t.name,
            t.format,
            t.status,
            t.registration_start_at,
            t.registration_end_at,
            t.prize_pool_usd,
            t.created_at,
            g.game_id,
            g.game_name,
            (SELECT COUNT(*) FROM TOURNAMENT_STAGE ts WHERE ts.tournament_id = t.tournament_id AND ts.group_generation_status != 'not_generated') AS active_group_stages
        FROM TOURNAMENT t
        JOIN GAME g ON t.game_id = g.game_id
        WHERE t.organizer_id = ?
        ORDER BY t.created_at DESC
    `;

    db.query(sql, [organizerId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO FETCH YOUR TOURNAMENTS"
            });
        }

        const enriched = results.map((t) => ({
            ...t,
            prize_pool_usd: t.prize_pool_usd !== null ? Number(t.prize_pool_usd) : null,
            registration_status: getRegistrationStatus(t, t.active_group_stages)
        }));

        return res.status(200).json({
            tournaments: enriched
        });
    });
});

/**
 * GET /api/tournaments/:id
 * Get one tournament's details.
 * A draft tournament is only visible to the organizer who owns it —
 * everyone else gets 404, so a draft never leaks through direct-id access.
 */
router.get("/:id", requireAuth, (req, res) => {
    const tournamentId = req.params.id;
    const userId = req.session.userId;

    const sql = `
        SELECT
            t.tournament_id,
            t.name,
            t.format,
            t.status,
            t.registration_start_at,
            t.registration_end_at,
            t.prize_pool_usd,
            t.created_at,
            g.game_id,
            g.game_name,
            u.user_id AS organizer_id,
            u.username AS organizer_username,
            (SELECT COUNT(*) FROM TOURNAMENT_STAGE ts WHERE ts.tournament_id = t.tournament_id AND ts.group_generation_status != 'not_generated') AS active_group_stages
        FROM TOURNAMENT t
        JOIN GAME g ON t.game_id = g.game_id
        JOIN USER u ON t.organizer_id = u.user_id
        WHERE t.tournament_id = ?
    `;

    db.query(sql, [tournamentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO FETCH TOURNAMENT"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND"
            });
        }

        const tournament = results[0];

        const isOwner = tournament.organizer_id === userId;

        if (tournament.status === "draft" && !isOwner) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND"
            });
        }

        tournament.prize_pool_usd = tournament.prize_pool_usd !== null ? Number(tournament.prize_pool_usd) : null;
        tournament.registration_status = getRegistrationStatus(tournament, tournament.active_group_stages);

        return res.status(200).json({
            tournament: tournament
        });
    });
});

/**
 * GET /api/tournaments/:tournamentId/results/pending
 * Organizer-only endpoint to get all pending submitted match results for a tournament.
 */
router.get("/:tournamentId/results/pending", requireAuth, requireRole("organizer"), async (req, res) => {
    const tournamentId = req.params.tournamentId;
    const organizerId = req.session.userId;

    try {
        const [tournaments] = await db.promise().query(
            `SELECT tournament_id, organizer_id FROM TOURNAMENT WHERE tournament_id = ?`,
            [tournamentId]
        );

        if (tournaments.length === 0) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND",
                code: "NOT_FOUND"
            });
        }

        if (tournaments[0].organizer_id !== organizerId) {
            return res.status(403).json({
                error: "YOU DO NOT OWN THIS TOURNAMENT",
                code: "FORBIDDEN"
            });
        }

        const [pendingResults] = await db.promise().query(
            `SELECT mr.result_id, mr.match_id, mr.winning_registration_id,
                    mr.team_a_kills, mr.team_b_kills, mr.evidence_url, mr.status, mr.submitted_at,
                    m.stage_id, m.group_id,
                    ts.stage_name, COALESCE(sg.group_name, 'Playoffs') AS group_name,
                    u.username AS submitted_by_username
             FROM MATCH_RESULT mr
             JOIN \`MATCH\` m ON mr.match_id = m.match_id
             JOIN TOURNAMENT_STAGE ts ON m.stage_id = ts.stage_id
             LEFT JOIN STAGE_GROUP sg ON m.group_id = sg.group_id
             JOIN USER u ON mr.submitted_by = u.user_id
             WHERE ts.tournament_id = ? AND UPPER(mr.status) = 'SUBMITTED'
             ORDER BY mr.submitted_at ASC`,
            [tournamentId]
        );

        // Fetch match participants for each pending result
        const resultsWithParticipants = [];
        for (const item of pendingResults) {
            const [participants] = await db.promise().query(
                `SELECT mp.registration_id, mp.side, tm.team_id, tm.team_name, tm.team_tag
                 FROM MATCH_PARTICIPANT mp
                 JOIN REGISTRATION r ON mp.registration_id = r.registration_id
                 JOIN TEAM tm ON r.team_id = tm.team_id
                 WHERE mp.match_id = ?
                 ORDER BY mp.side ASC`,
                [item.match_id]
            );
            resultsWithParticipants.push({
                ...item,
                participants: participants
            });
        }

        return res.status(200).json({
            pendingResults: resultsWithParticipants
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "FAILED TO FETCH PENDING MATCH RESULTS",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
});

/**
 * POST /api/tournaments
 * Organizer-only. Creates a new tournament, always starting in "draft".
 * Validates game_id, format, timeline, and prize_pool_usd.
 */
router.post("/", requireAuth, requireRole("organizer"), (req, res) => {
    const organizerId = req.session.userId;
    const { game_id, name, format, registration_start_at, registration_end_at, prize_pool_usd } = req.body;

    if (!game_id || !name || !format) {
        return res.status(400).json({
            error: "GAME ID, NAME, AND FORMAT ARE REQUIRED"
        });
    }

    if (!VALID_FORMATS.includes(format)) {
        return res.status(400).json({
            error: "FORMAT MUST BE 'single_elimination' OR 'double_elimination'"
        });
    }

    const prizeCheck = validatePrizePool(prize_pool_usd);
    if (!prizeCheck.valid) {
        return res.status(400).json({
            error: prizeCheck.error,
            code: "INVALID_PRIZE_POOL"
        });
    }

    const normStart = normalizeTimestamp(registration_start_at);
    const normEnd = normalizeTimestamp(registration_end_at);

    if (normStart && normEnd) {
        if (new Date(normEnd) <= new Date(normStart)) {
            return res.status(400).json({
                error: "REGISTRATION DEADLINE MUST BE AFTER REGISTRATION START TIME",
                code: "REGISTRATION_TIMELINE_INVALID"
            });
        }
    }

    const gameCheckSql = `SELECT game_id FROM GAME WHERE game_id = ?`;

    db.query(gameCheckSql, [game_id], (err, gameResults) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO VALIDATE GAME"
            });
        }

        if (gameResults.length === 0) {
            return res.status(400).json({
                error: "SELECTED GAME DOES NOT EXIST"
            });
        }

        const insertSql = `
            INSERT INTO TOURNAMENT (game_id, organizer_id, name, format, status, registration_start_at, registration_end_at, prize_pool_usd)
            VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)
        `;

        db.query(insertSql, [game_id, organizerId, name, format, normStart, normEnd, prizeCheck.value], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "FAILED TO CREATE TOURNAMENT"
                });
            }

            return res.status(201).json({
                message: "TOURNAMENT CREATED SUCCESSFULLY",
                tournamentId: result.insertId,
                registration_start_at: normStart,
                registration_end_at: normEnd,
                prize_pool_usd: prizeCheck.value
            });
        });
    });
});

/**
 * PUT /api/tournaments/:id
 * Organizer-only, owner-only. Edits name/game/format/timeline/prize_pool_usd.
 * Only allowed while the tournament is still in "draft".
 */
router.put("/:id", requireAuth, requireRole("organizer"), (req, res) => {
    const tournamentId = req.params.id;
    const organizerId = req.session.userId;
    const { game_id, name, format, registration_start_at, registration_end_at, prize_pool_usd } = req.body;

    if (!game_id || !name || !format) {
        return res.status(400).json({
            error: "GAME ID, NAME, AND FORMAT ARE REQUIRED"
        });
    }

    if (!VALID_FORMATS.includes(format)) {
        return res.status(400).json({
            error: "FORMAT MUST BE 'single_elimination' OR 'double_elimination'"
        });
    }

    const prizeCheck = validatePrizePool(prize_pool_usd);
    if (!prizeCheck.valid) {
        return res.status(400).json({
            error: prizeCheck.error,
            code: "INVALID_PRIZE_POOL"
        });
    }

    const normStart = normalizeTimestamp(registration_start_at);
    const normEnd = normalizeTimestamp(registration_end_at);

    if (normStart && normEnd) {
        if (new Date(normEnd) <= new Date(normStart)) {
            return res.status(400).json({
                error: "REGISTRATION DEADLINE MUST BE AFTER REGISTRATION START TIME",
                code: "REGISTRATION_TIMELINE_INVALID"
            });
        }
    }

    const ownerCheckSql = `SELECT organizer_id, status FROM TOURNAMENT WHERE tournament_id = ?`;

    db.query(ownerCheckSql, [tournamentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO VALIDATE TOURNAMENT"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND"
            });
        }

        if (results[0].organizer_id !== organizerId) {
            return res.status(403).json({
                error: "YOU DO NOT OWN THIS TOURNAMENT"
            });
        }

        if (results[0].status !== "draft") {
            return res.status(400).json({
                error: "ONLY DRAFT TOURNAMENTS CAN BE EDITED"
            });
        }

        const gameCheckSql = `SELECT game_id FROM GAME WHERE game_id = ?`;

        db.query(gameCheckSql, [game_id], (err, gameResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "FAILED TO VALIDATE GAME"
                });
            }

            if (gameResults.length === 0) {
                return res.status(400).json({
                    error: "SELECTED GAME DOES NOT EXIST"
                });
            }

            const updateSql = `
                UPDATE TOURNAMENT
                SET game_id = ?, name = ?, format = ?, registration_start_at = ?, registration_end_at = ?, prize_pool_usd = ?
                WHERE tournament_id = ?
            `;

            db.query(updateSql, [game_id, name, format, normStart, normEnd, prizeCheck.value, tournamentId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        error: "FAILED TO UPDATE TOURNAMENT"
                    });
                }

                return res.status(200).json({
                    message: "TOURNAMENT UPDATED SUCCESSFULLY"
                });
            });
        });
    });
});

/**
 * PUT /api/tournaments/:id/registration-timeline
 * Organizer-only, owner-only. Updates registration start/end timeline or extends deadline.
 */
router.put("/:id/registration-timeline", requireAuth, requireRole("organizer"), async (req, res) => {
    const tournamentId = req.params.id;
    const organizerId = req.session.userId;
    const { registration_start_at, registration_end_at } = req.body;

    try {
        const [rows] = await db.promise().query(
            `SELECT t.tournament_id, t.organizer_id, t.status, t.registration_start_at, t.registration_end_at,
                    (SELECT COUNT(*) FROM TOURNAMENT_STAGE ts WHERE ts.tournament_id = t.tournament_id AND ts.group_generation_status != 'not_generated') AS active_group_stages
             FROM TOURNAMENT t WHERE t.tournament_id = ?`,
            [tournamentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND",
                code: "NOT_FOUND"
            });
        }

        const tournament = rows[0];

        if (tournament.organizer_id !== organizerId) {
            return res.status(403).json({
                error: "YOU DO NOT OWN THIS TOURNAMENT",
                code: "FORBIDDEN"
            });
        }

        if (tournament.status === "completed") {
            return res.status(400).json({
                error: "CANNOT UPDATE TIMELINE OF A COMPLETED TOURNAMENT",
                code: "TOURNAMENT_COMPLETED"
            });
        }

        const now = new Date();
        const normStart = registration_start_at !== undefined ? normalizeTimestamp(registration_start_at) : (tournament.registration_start_at ? normalizeTimestamp(tournament.registration_start_at) : null);
        const normEnd = registration_end_at !== undefined ? normalizeTimestamp(registration_end_at) : (tournament.registration_end_at ? normalizeTimestamp(tournament.registration_end_at) : null);

        // Validation 1: start < end
        if (normStart && normEnd) {
            if (new Date(normEnd) <= new Date(normStart)) {
                return res.status(400).json({
                    error: "REGISTRATION DEADLINE MUST BE AFTER REGISTRATION START TIME",
                    code: "REGISTRATION_TIMELINE_INVALID"
                });
            }
        }

        // Validation 2: When extending registration_end_at, the new deadline MUST be in the future
        if (registration_end_at !== undefined && normEnd) {
            if (new Date(normEnd) <= now) {
                return res.status(400).json({
                    error: "NEW REGISTRATION DEADLINE MUST BE IN THE FUTURE",
                    code: "REGISTRATION_DEADLINE_INVALID"
                });
            }
        }

        // Validation 3: Cannot move registration_start_at after registration has already opened
        if (registration_start_at !== undefined && tournament.registration_start_at) {
            const existingStart = new Date(tournament.registration_start_at);
            if (now >= existingStart && normStart !== normalizeTimestamp(tournament.registration_start_at)) {
                return res.status(400).json({
                    error: "CANNOT MODIFY REGISTRATION START TIME AFTER REGISTRATION HAS ALREADY BEGUN",
                    code: "REGISTRATION_TIMELINE_INVALID"
                });
            }
        }

        await db.promise().query(
            `UPDATE TOURNAMENT SET registration_start_at = ?, registration_end_at = ? WHERE tournament_id = ?`,
            [normStart, normEnd, tournamentId]
        );

        const updatedTournament = {
            ...tournament,
            registration_start_at: normStart,
            registration_end_at: normEnd
        };

        const registration_status = getRegistrationStatus(updatedTournament, tournament.active_group_stages);

        return res.status(200).json({
            message: "REGISTRATION TIMELINE UPDATED SUCCESSFULLY",
            registration_start_at: normStart,
            registration_end_at: normEnd,
            registration_status: registration_status
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: "FAILED TO UPDATE REGISTRATION TIMELINE",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
});

/**
 * PATCH /api/tournaments/:id/status
 * Organizer-only, owner-only. Moves the tournament forward through its
 * lifecycle. Rejects any transition not explicitly allowed
 * (e.g. draft -> live, or completed -> live) with a clear 400 error
 * instead of silently accepting it.
 */
router.patch("/:id/status", requireAuth, requireRole("organizer"), (req, res) => {
    const tournamentId = req.params.id;
    const organizerId = req.session.userId;
    const { status } = req.body;

    if (!status || !Object.keys(VALID_STATUS_TRANSITIONS).includes(status)) {
        return res.status(400).json({
            error: "STATUS MUST BE ONE OF: draft, published, live, completed"
        });
    }

    const ownerCheckSql = `SELECT organizer_id, status FROM TOURNAMENT WHERE tournament_id = ?`;

    db.query(ownerCheckSql, [tournamentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "FAILED TO VALIDATE TOURNAMENT"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "TOURNAMENT NOT FOUND"
            });
        }

        if (results[0].organizer_id !== organizerId) {
            return res.status(403).json({
                error: "YOU DO NOT OWN THIS TOURNAMENT"
            });
        }

        const currentStatus = results[0].status;
        const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];

        if (!allowedNextStatuses.includes(status)) {
            return res.status(400).json({
                error: `CANNOT MOVE TOURNAMENT FROM '${currentStatus}' TO '${status}'`
            });
        }

        const updateSql = `UPDATE TOURNAMENT SET status = ? WHERE tournament_id = ?`;

        db.query(updateSql, [status, tournamentId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "FAILED TO UPDATE TOURNAMENT STATUS"
                });
            }

            return res.status(200).json({
                message: `TOURNAMENT STATUS UPDATED TO '${status}'`
            });
        });
    });
});

module.exports = router;