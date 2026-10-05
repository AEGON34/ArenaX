const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/team-applications
 * Apply to join a team's main roster.
 */
router.post("/", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { team_id, game_account_id } = req.body;

  if (!team_id || !game_account_id) {
    return res.status(400).json({ error: "TEAM ID AND GAME ACCOUNT ID ARE REQUIRED" });
  }

  // Check 2: Verify game account ownership
  const gaCheckSql = `
    SELECT account_id, user_id, game_id
    FROM GAME_ACCOUNT
    WHERE account_id = ? AND user_id = ?
  `;

  db.query(gaCheckSql, [game_account_id, userId], (err, gaResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO VERIFY GAME ACCOUNT OWNERSHIP" });
    }

    if (gaResults.length === 0) {
      return res.status(403).json({ error: "YOU ARE NOT AUTHORIZED TO USE THIS GAME ACCOUNT" });
    }

    const playerGa = gaResults[0];

    // Check 3 & 4: Verify team exists and is same game
    const teamCheckSql = `
      SELECT t.team_id, t.game_id, t.captain_id, ga.user_id AS captain_user_id, t.status
      FROM TEAM t
      JOIN GAME_ACCOUNT ga ON t.captain_id = ga.account_id
      WHERE t.team_id = ?
    `;

    db.query(teamCheckSql, [team_id], (err, teamResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FAILED TO VERIFY TEAM" });
      }

      if (teamResults.length === 0) {
        return res.status(404).json({ error: "TEAM NOT FOUND" });
      }

      const team = teamResults[0];

      if (playerGa.game_id !== team.game_id) {
        return res.status(400).json({ error: "TEAM AND PLAYER MUST BELONG TO THE SAME GAME" });
      }

      // Check 7: Self-application protection
      if (team.captain_id === game_account_id || team.captain_user_id === userId) {
        return res.status(400).json({ error: "YOU CANNOT APPLY TO YOUR OWN TEAM" });
      }

      // Check 5: Player not already an active member of ANY team
      const activeMemberCheckSql = `
        SELECT member_id
        FROM TEAM_MEMBER
        WHERE game_account_id = ? AND is_active = TRUE
      `;

      db.query(activeMemberCheckSql, [game_account_id], (err, memberResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "FAILED TO CHECK PLAYER TEAM MEMBERSHIP" });
        }

        if (memberResults.length > 0) {
          return res.status(400).json({ error: "YOU ARE ALREADY A MEMBER OF AN ACTIVE TEAM" });
        }

        // Check 6: Check team open main-roster slots
        const rosterCheckSql = `
          SELECT COUNT(*) AS active_main
          FROM TEAM_MEMBER
          WHERE team_id = ? AND is_active = TRUE AND is_substitute = FALSE
        `;

        db.query(rosterCheckSql, [team_id], (err, rosterResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "FAILED TO CHECK TEAM ROSTER CAPACITY" });
          }

          const activeMain = rosterResults[0].active_main || 0;
          if (activeMain >= 5) {
            return res.status(400).json({ error: "THIS TEAM'S MAIN ROSTER IS FULL" });
          }

          // Check 8: Duplicate pending application check
          const dupAppCheckSql = `
            SELECT application_id
            FROM TEAM_APPLICATION
            WHERE team_id = ? AND game_account_id = ? AND status = 'pending'
          `;

          db.query(dupAppCheckSql, [team_id, game_account_id], (err, dupAppResults) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: "FAILED TO CHECK PENDING APPLICATIONS" });
            }

            if (dupAppResults.length > 0) {
              return res.status(409).json({ error: "AN APPLICATION IS ALREADY PENDING FOR THIS TEAM" });
            }

            // Check 9: Pending invitation conflict check
            const invConflictCheckSql = `
              SELECT invitation_id
              FROM TEAM_INVITATION
              WHERE team_id = ? AND game_account_id = ? AND status = 'pending'
            `;

            db.query(invConflictCheckSql, [team_id, game_account_id], (err, invResults) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: "FAILED TO CHECK PENDING INVITATIONS" });
              }

              if (invResults.length > 0) {
                return res.status(409).json({ error: "THIS TEAM HAS ALREADY SENT YOU AN INVITATION" });
              }

              // Create Application
              const insertSql = `
                INSERT INTO TEAM_APPLICATION (team_id, game_account_id, status, applied_at)
                VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)
              `;

              db.query(insertSql, [team_id, game_account_id], (err, insertResults) => {
                if (err) {
                  console.error(err);
                  return res.status(500).json({ error: "FAILED TO CREATE TEAM APPLICATION" });
                }

                res.status(201).json({
                  message: "TEAM APPLICATION SENT SUCCESSFULLY",
                  applicationId: insertResults.insertId
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
 * GET /api/team-applications/my
 * Player view: Get applications submitted by logged-in user.
 */
router.get("/my", requireAuth, (req, res) => {
  const userId = req.session.userId;

  const sql = `
    SELECT
      ta.application_id,
      ta.team_id,
      t.team_name,
      t.team_tag,
      g.game_name,
      t.status AS team_status,
      ta.status AS application_status,
      ta.applied_at,
      ta.responded_at
    FROM TEAM_APPLICATION ta
    JOIN TEAM t ON ta.team_id = t.team_id
    JOIN GAME g ON t.game_id = g.game_id
    JOIN GAME_ACCOUNT ga ON ta.game_account_id = ga.account_id
    WHERE ga.user_id = ?
    ORDER BY ta.applied_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO FETCH MY TEAM APPLICATIONS" });
    }

    res.status(200).json({
      applications: results
    });
  });
});

/**
 * GET /api/team-applications/received
 * Captain view: Get applications received by teams owned by logged-in captain.
 */
router.get("/received", requireAuth, (req, res) => {
  const userId = req.session.userId;

  const sql = `
    SELECT
      ta.application_id,
      ta.team_id,
      t.team_name,
      t.team_tag,
      g.game_name,
      applicant_ga.account_id AS game_account_id,
      applicant_ga.game_username,
      applicant_ga.game_uid,
      fa.preferred_role,
      applicant_ga.university,
      ta.status AS application_status,
      ta.applied_at,
      ta.responded_at
    FROM TEAM_APPLICATION ta
    JOIN TEAM t ON ta.team_id = t.team_id
    JOIN GAME g ON t.game_id = g.game_id
    JOIN GAME_ACCOUNT captain_ga ON t.captain_id = captain_ga.account_id
    JOIN GAME_ACCOUNT applicant_ga ON ta.game_account_id = applicant_ga.account_id
    LEFT JOIN FREE_AGENT_PROFILE fa ON applicant_ga.account_id = fa.game_account_id
    WHERE captain_ga.user_id = ?
    ORDER BY ta.applied_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO FETCH RECEIVED TEAM APPLICATIONS" });
    }

    res.status(200).json({
      applications: results
    });
  });
});

/**
 * POST /api/team-applications/:id/accept
 * Captain accepts a team application using a database transaction.
 */
router.post("/:id/accept", requireAuth, (req, res) => {
  const applicationId = req.params.id;
  const userId = req.session.userId;

  db.beginTransaction((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO START TRANSACTION" });
    }

    // 1. Lock and select application details
    const appSql = `
      SELECT
        ta.application_id,
        ta.team_id,
        ta.game_account_id,
        ta.status,
        t.game_id AS team_game_id,
        t.captain_id,
        captain_ga.user_id AS captain_user_id,
        applicant_ga.game_id AS player_game_id
      FROM TEAM_APPLICATION ta
      JOIN TEAM t ON ta.team_id = t.team_id
      JOIN GAME_ACCOUNT captain_ga ON t.captain_id = captain_ga.account_id
      JOIN GAME_ACCOUNT applicant_ga ON ta.game_account_id = applicant_ga.account_id
      WHERE ta.application_id = ?
      FOR UPDATE
    `;

    db.query(appSql, [applicationId], (err, appResults) => {
      if (err) {
        console.error(err);
        return db.rollback(() => {
          res.status(500).json({ error: "FAILED TO FETCH APPLICATION DETAILS" });
        });
      }

      if (appResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: "TEAM APPLICATION NOT FOUND" });
        });
      }

      const app = appResults[0];

      if (app.captain_user_id !== userId) {
        return db.rollback(() => {
          res.status(403).json({ error: "YOU ARE NOT AUTHORIZED TO PERFORM THIS ACTION" });
        });
      }

      if (app.status !== "pending") {
        return db.rollback(() => {
          res.status(409).json({ error: "APPLICATION IS NO LONGER PENDING" });
        });
      }

      if (app.team_game_id !== app.player_game_id) {
        return db.rollback(() => {
          res.status(400).json({ error: "TEAM AND PLAYER GAME MISMATCH" });
        });
      }

      //agei member kina
      const memberCheckSql = `
        SELECT member_id
        FROM TEAM_MEMBER
        WHERE game_account_id = ? AND is_active = TRUE
      `;

      db.query(memberCheckSql, [app.game_account_id], (err, memberResults) => {
        if (err) {
          console.error(err);
          return db.rollback(() => {
            res.status(500).json({ error: "FAILED TO CHECK PLAYER ACTIVE MEMBERSHIP" });
          });
        }

        if (memberResults.length > 0) {
          return db.rollback(() => {
            res.status(409).json({ error: "PLAYER IS ALREADY AN ACTIVE MEMBER OF A TEAM" });
          });
        }

        // bortoman main rostar + total active count check
        const capacitySql = `
          SELECT
            COUNT(*) AS total_active,
            SUM(CASE WHEN is_substitute = FALSE THEN 1 ELSE 0 END) AS active_main
          FROM TEAM_MEMBER
          WHERE team_id = ? AND is_active = TRUE
        `;

        db.query(capacitySql, [app.team_id], (err, capacityResults) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).json({ error: "FAILED TO CHECK TEAM ROSTER CAPACITY" });
            });
          }

          const activeMain = capacityResults[0].active_main || 0;
          const totalActive = capacityResults[0].total_active || 0;

          // FIX: instead of hard-blocking when the main roster (5) is full,
          // mirror the invitation-accept flow - bring the player in as a
          // substitute instead. This matches how team-invitations already
          // behave, so both join paths are now consistent.
          let role = "player";
          let isSubstitute = false;

          if (activeMain >= 5) {
            role = "substitute";
            isSubstitute = true;
          }

          // Insert into TEAM_MEMBER 
          const insertMemberSql = `
            INSERT INTO TEAM_MEMBER (team_id, game_account_id, role, is_substitute, is_active)
            VALUES (?, ?, ?, ?, TRUE)
          `;

          db.query(insertMemberSql, [app.team_id, app.game_account_id, role, isSubstitute], (err) => {
            if (err) {
              console.error(err);
              return db.rollback(() => {
                res.status(500).json({ error: "FAILED TO ADD PLAYER TO TEAM ROSTER" });
              });
            }

            // Update TEAM_APPLICATION status = 'accepted'
            const updateAppSql = `
              UPDATE TEAM_APPLICATION
              SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
              WHERE application_id = ?
            `;

            db.query(updateAppSql, [applicationId], (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).json({ error: "FAILED TO UPDATE APPLICATION STATUS" });
                });
              }

              // Update Free Agent Profile to unavailable
              const updateFaSql = `
                UPDATE FREE_AGENT_PROFILE
                SET availability_status = 'unavailable'
                WHERE game_account_id = ?
              `;

              db.query(updateFaSql, [app.game_account_id], (err) => {
                if (err) console.error(err);

                const updateGaSql = `
                  UPDATE GAME_ACCOUNT
                  SET is_free_agent = FALSE
                  WHERE account_id = ?
                `;

                db.query(updateGaSql, [app.game_account_id], (err) => {
                  if (err) console.error(err);

                  // Update team status if total active roster now reaches 5
                  const newTotalActive = totalActive + 1;
                  const updateTeamSql = newTotalActive >= 5
                    ? `UPDATE TEAM SET status = 'active' WHERE team_id = ?`
                    : `SELECT 1`;

                  db.query(updateTeamSql, [app.team_id], (err) => {
                    if (err) console.error(err);

                    // Reject player's other pending TEAM_APPLICATION records
                    const rejectOtherAppsSql = `
                      UPDATE TEAM_APPLICATION
                      SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
                      WHERE game_account_id = ? AND status = 'pending' AND application_id != ?
                    `;

                    db.query(rejectOtherAppsSql, [app.game_account_id, applicationId], (err) => {
                      if (err) console.error(err);

                      // Reject player's other pending TEAM_INVITATION records
                      const rejectOtherInvsSql = `
                        UPDATE TEAM_INVITATION
                        SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
                        WHERE game_account_id = ? AND status = 'pending'
                      `;

                      db.query(rejectOtherInvsSql, [app.game_account_id], (err) => {
                        if (err) console.error(err);

                        db.commit((err) => {
                          if (err) {
                            console.error(err);
                            return db.rollback(() => {
                              res.status(500).json({ error: "FAILED TO COMMIT TRANSACTION" });
                            });
                          }

                          res.status(200).json({
                            message: "TEAM APPLICATION ACCEPTED SUCCESSFULLY"
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
    });
  });
});

/**
 * POST /api/team-applications/:id/reject
 * Captain rejects a team application.
 */
router.post("/:id/reject", requireAuth, (req, res) => {
  const applicationId = req.params.id;
  const userId = req.session.userId;

  const checkSql = `
    SELECT ta.application_id, ta.status
    FROM TEAM_APPLICATION ta
    JOIN TEAM t ON ta.team_id = t.team_id
    JOIN GAME_ACCOUNT captain_ga ON t.captain_id = captain_ga.account_id
    WHERE ta.application_id = ? AND captain_ga.user_id = ?
  `;

  db.query(checkSql, [applicationId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO VERIFY APPLICATION" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "TEAM APPLICATION NOT FOUND OR ACCESS DENIED" });
    }

    if (results[0].status !== "pending") {
      return res.status(409).json({ error: "APPLICATION IS NO LONGER PENDING" });
    }

    const updateSql = `
      UPDATE TEAM_APPLICATION
      SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
      WHERE application_id = ?
    `;

    db.query(updateSql, [applicationId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FAILED TO REJECT TEAM APPLICATION" });
      }

      res.status(200).json({
        message: "TEAM APPLICATION REJECTED SUCCESSFULLY"
      });
    });
  });
});

module.exports = router;