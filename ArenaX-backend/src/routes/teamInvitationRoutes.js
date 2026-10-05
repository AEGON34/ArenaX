const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/team-invitations
 * Create a team invitation sent by a team captain to a player.
 */
router.post("/", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { team_id, game_account_id } = req.body;

  if (!team_id || !game_account_id) {
    return res.status(400).json({ error: "TEAM ID AND GAME ACCOUNT ID ARE REQUIRED" });
  }

  // 1. Verify team exists and logged-in user is captain
  const teamCheckSql = `
    SELECT t.team_id, t.game_id, t.captain_id, ga.user_id AS captain_user_id
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

    if (team.captain_user_id !== userId) {
      return res.status(403).json({ error: "YOU ARE NOT AUTHORIZED TO INVITE PLAYERS FOR THIS TEAM" });
    }

    // 2. Verify target game account exists
    const playerCheckSql = `
      SELECT account_id, user_id, game_id
      FROM GAME_ACCOUNT
      WHERE account_id = ?
    `;

    db.query(playerCheckSql, [game_account_id], (err, playerResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FAILED TO VERIFY PLAYER GAME ACCOUNT" });
      }

      if (playerResults.length === 0) {
        return res.status(404).json({ error: "PLAYER GAME ACCOUNT NOT FOUND" });
      }

      const playerAccount = playerResults[0];

      // 3. Self-invitation check
      if (playerAccount.user_id === userId || playerAccount.account_id === team.captain_id) {
        return res.status(400).json({ error: "YOU CANNOT INVITE YOUR OWN GAME ACCOUNT" });
      }

      // 4. Cross-game invitation check
      if (playerAccount.game_id !== team.game_id) {
        return res.status(400).json({ error: "TEAM AND PLAYER MUST BELONG TO THE SAME GAME" });
      }

      // 5. Check if target player is already an active member of ANY team
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
          return res.status(400).json({ error: "PLAYER IS ALREADY AN ACTIVE MEMBER OF A TEAM" });
        }

        // 6. Check if pending invitation already exists for this team + game account
        const duplicateCheckSql = `
          SELECT invitation_id
          FROM TEAM_INVITATION
          WHERE team_id = ? AND game_account_id = ? AND status = 'pending'
        `;

        db.query(duplicateCheckSql, [team_id, game_account_id], (err, duplicateResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "FAILED TO CHECK DUPLICATE INVITATIONS" });
          }

          if (duplicateResults.length > 0) {
            return res.status(409).json({ error: "AN INVITATION IS ALREADY PENDING FOR THIS PLAYER" });
          }

          // 6b. Check if player has a pending TEAM_APPLICATION to this team
          const appCheckSql = `
            SELECT application_id
            FROM TEAM_APPLICATION
            WHERE team_id = ? AND game_account_id = ? AND status = 'pending'
          `;

          db.query(appCheckSql, [team_id, game_account_id], (err, appCheckResults) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: "FAILED TO CHECK PLAYER APPLICATIONS" });
            }

            if (appCheckResults.length > 0) {
              return res.status(409).json({ error: "THIS PLAYER ALREADY HAS A PENDING APPLICATION FOR THIS TEAM" });
            }

            // 7. Insert Invitation
            const insertSql = `
              INSERT INTO TEAM_INVITATION (team_id, game_account_id, status, sent_at)
              VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)
            `;

            db.query(insertSql, [team_id, game_account_id], (err, insertResults) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: "FAILED TO CREATE TEAM INVITATION" });
              }

              res.status(201).json({
                message: "INVITATION SENT SUCCESSFULLY",
                invitationId: insertResults.insertId
              });
            });
          });
        });
      });
    });
  });
});

/**
 * GET /api/team-invitations/my
 * Get invitations received by the logged-in user.
 */
router.get("/my", requireAuth, (req, res) => {
  const userId = req.session.userId;

  const sql = `
    SELECT
      ti.invitation_id,
      ti.team_id,
      t.team_name,
      t.team_tag,
      t.status AS team_status,
      g.game_name,
      ti.status AS invitation_status,
      ti.sent_at,
      ti.responded_at,
      captain_ga.game_username AS captain_username
    FROM TEAM_INVITATION ti
    JOIN TEAM t ON ti.team_id = t.team_id
    JOIN GAME g ON t.game_id = g.game_id
    JOIN GAME_ACCOUNT target_ga ON ti.game_account_id = target_ga.account_id
    JOIN GAME_ACCOUNT captain_ga ON t.captain_id = captain_ga.account_id
    WHERE target_ga.user_id = ?
    ORDER BY ti.sent_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO FETCH TEAM INVITATIONS" });
    }

    res.status(200).json({
      invitations: results
    });
  });
});

/**
 * POST /api/team-invitations/:id/accept
 * Accept a team invitation using a database transaction.
 */
router.post("/:id/accept", requireAuth, (req, res) => {
  const invitationId = req.params.id;
  const userId = req.session.userId;

  db.beginTransaction((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO START INVITATION ACCEPTANCE TRANSACTION" });
    }

    // 1. Lock and fetch invitation details
    const invSql = `
      SELECT
        ti.invitation_id,
        ti.team_id,
        ti.game_account_id,
        ti.status,
        t.game_id AS team_game_id,
        target_ga.game_id AS player_game_id,
        target_ga.user_id AS player_user_id
      FROM TEAM_INVITATION ti
      JOIN TEAM t ON ti.team_id = t.team_id
      JOIN GAME_ACCOUNT target_ga ON ti.game_account_id = target_ga.account_id
      WHERE ti.invitation_id = ?
      FOR UPDATE
    `;

    db.query(invSql, [invitationId], (err, invResults) => {
      if (err) {
        console.error(err);
        return db.rollback(() => {
          res.status(500).json({ error: "FAILED TO FETCH INVITATION DETAILS" });
        });
      }

      if (invResults.length === 0) {
        return db.rollback(() => {
          res.status(404).json({ error: "INVITATION NOT FOUND" });
        });
      }

      const inv = invResults[0];

      if (inv.player_user_id !== userId) {
        return db.rollback(() => {
          res.status(403).json({ error: "YOU ARE NOT AUTHORIZED TO ACCEPT THIS INVITATION" });
        });
      }

      if (inv.status !== "pending") {
        return db.rollback(() => {
          res.status(409).json({ error: "INVITATION IS NO LONGER PENDING" });
        });
      }

      if (inv.team_game_id !== inv.player_game_id) {
        return db.rollback(() => {
          res.status(400).json({ error: "TEAM AND PLAYER GAME MISMATCH" });
        });
      }

      // 2. Check if player is already an active member of ANY team
      const memberCheckSql = `
        SELECT member_id
        FROM TEAM_MEMBER
        WHERE game_account_id = ? AND is_active = TRUE
      `;

      db.query(memberCheckSql, [inv.game_account_id], (err, memberResults) => {
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

        // 3. Check active main roster count
        const capacitySql = `
          SELECT 
            COUNT(*) AS total_active,
            SUM(CASE WHEN is_substitute = FALSE THEN 1 ELSE 0 END) AS active_main
          FROM TEAM_MEMBER
          WHERE team_id = ? AND is_active = TRUE
        `;

        db.query(capacitySql, [inv.team_id], (err, capacityResults) => {
          if (err) {
            console.error(err);
            return db.rollback(() => {
              res.status(500).json({ error: "FAILED TO CHECK TEAM ROSTER CAPACITY" });
            });
          }

          const activeMain = capacityResults[0].active_main || 0;
          const totalActive = capacityResults[0].total_active || 0;

          let role = "player";
          let isSubstitute = false;

          if (activeMain >= 5) {
            role = "substitute";
            isSubstitute = true;
          }

          // 4. Insert into TEAM_MEMBER
          const insertMemberSql = `
            INSERT INTO TEAM_MEMBER (team_id, game_account_id, role, is_substitute, is_active)
            VALUES (?, ?, ?, ?, TRUE)
          `;

          db.query(insertMemberSql, [inv.team_id, inv.game_account_id, role, isSubstitute], (err) => {
            if (err) {
              console.error(err);
              return db.rollback(() => {
                res.status(500).json({ error: "FAILED TO ADD PLAYER TO TEAM ROSTER" });
              });
            }

            // 5. Update TEAM_INVITATION status = 'accepted'
            const updateInvSql = `
              UPDATE TEAM_INVITATION
              SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
              WHERE invitation_id = ?
            `;

            db.query(updateInvSql, [invitationId], (err) => {
              if (err) {
                console.error(err);
                return db.rollback(() => {
                  res.status(500).json({ error: "FAILED TO UPDATE INVITATION STATUS" });
                });
              }

              // 6. Update Free Agent status
              const updateFaSql = `
                UPDATE FREE_AGENT_PROFILE
                SET availability_status = 'unavailable'
                WHERE game_account_id = ?
              `;

              db.query(updateFaSql, [inv.game_account_id], (err) => {
                if (err) {
                  console.error(err);
                }

                const updateGaSql = `
                  UPDATE GAME_ACCOUNT
                  SET is_free_agent = FALSE
                  WHERE account_id = ?
                `;

                db.query(updateGaSql, [inv.game_account_id], (err) => {
                  if (err) {
                    console.error(err);
                  }

                  // 7. Update team status if team now has 5 or more active members
                  const newTotalActive = totalActive + 1;
                  const updateTeamSql = newTotalActive >= 5
                    ? `UPDATE TEAM SET status = 'active' WHERE team_id = ?`
                    : `SELECT 1`;

                  db.query(updateTeamSql, [inv.team_id], (err) => {
                    if (err) {
                      console.error(err);
                    }

                    // 8. Reject other pending invitations and applications for this player
                    const rejectOtherInvsSql = `
                      UPDATE TEAM_INVITATION
                      SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
                      WHERE game_account_id = ? AND status = 'pending' AND invitation_id != ?
                    `;

                    db.query(rejectOtherInvsSql, [inv.game_account_id, invitationId], (err) => {
                      if (err) {
                        console.error(err);
                      }

                      const rejectOtherAppsSql = `
                        UPDATE TEAM_APPLICATION
                        SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
                        WHERE game_account_id = ? AND status = 'pending'
                      `;

                      db.query(rejectOtherAppsSql, [inv.game_account_id], (err) => {
                        if (err) {
                          console.error(err);
                        }

                        // 9. Commit Transaction
                        db.commit((err) => {
                          if (err) {
                            console.error(err);
                            return db.rollback(() => {
                              res.status(500).json({ error: "FAILED TO COMMIT INVITATION ACCEPTANCE" });
                            });
                          }

                          res.status(200).json({
                            message: "INVITATION ACCEPTED SUCCESSFULLY"
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
 * POST /api/team-invitations/:id/reject
 * Reject a team invitation.
 */
router.post("/:id/reject", requireAuth, (req, res) => {
  const invitationId = req.params.id;
  const userId = req.session.userId;

  // Verify ownership and pending status
  const checkSql = `
    SELECT ti.invitation_id, ti.status
    FROM TEAM_INVITATION ti
    JOIN GAME_ACCOUNT target_ga ON ti.game_account_id = target_ga.account_id
    WHERE ti.invitation_id = ? AND target_ga.user_id = ?
  `;

  db.query(checkSql, [invitationId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO VERIFY INVITATION" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "INVITATION NOT FOUND OR ACCESS DENIED" });
    }

    if (results[0].status !== "pending") {
      return res.status(409).json({ error: "INVITATION IS NO LONGER PENDING" });
    }

    const updateSql = `
      UPDATE TEAM_INVITATION
      SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
      WHERE invitation_id = ?
    `;

    db.query(updateSql, [invitationId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FAILED TO REJECT INVITATION" });
      }

      res.status(200).json({
        message: "INVITATION REJECTED SUCCESSFULLY"
      });
    });
  });
});

module.exports = router;
