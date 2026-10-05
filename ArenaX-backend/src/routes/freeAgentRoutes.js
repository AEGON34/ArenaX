const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/free-agents
 * Main recruitment discovery endpoint.
 * Authorization: Organizer or Team Captain only.
 * Filters: game_id, preferred_role, university, search (username or UID).
 * Enforces: Excludes current active team members and captains.
 */
router.get("/", requireAuth, (req, res) => {
  const userId = req.session.userId;

  // 1. Check if user is an organizer OR a team captain
  const authCheckSql = `
    SELECT u.role, 
      (SELECT COUNT(*) 
       FROM TEAM t 
       JOIN GAME_ACCOUNT ga ON t.captain_id = ga.account_id 
       WHERE ga.user_id = ?) AS captain_count
    FROM USER u
    WHERE u.user_id = ?
  `;

  db.query(authCheckSql, [userId, userId], (err, authResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO CHECK AUTHORIZATION" });
    }

    if (authResults.length === 0) {
      return res.status(401).json({ error: "AUTHENTICATION REQUIRED" });
    }

    const { role, captain_count } = authResults[0];
    const isOrganizer = role === "organizer";
    const isCaptain = captain_count > 0;

    if (!isOrganizer && !isCaptain) {
      return res.status(403).json({
        error: "YOU ARE NOT AUTHORIZED TO ACCESS RECRUITMENT DISCOVERY. ORGANIZER OR TEAM CAPTAIN ROLE REQUIRED"
      });
    }

    // 2. Build dynamic filtering SQL
    const { game_id, preferred_role, university, search } = req.query;

    let sql = `
      SELECT
        f.free_agent_id,
        ga.account_id,
        ga.game_id,
        g.game_name,
        ga.game_username,
        ga.game_uid,
        ga.server_region,
        f.preferred_role,
        ga.university,
        f.availability_status
      FROM FREE_AGENT_PROFILE f
      JOIN GAME_ACCOUNT ga ON f.game_account_id = ga.account_id
      JOIN GAME g ON ga.game_id = g.game_id
      WHERE f.availability_status = 'available'
        AND ga.account_id NOT IN (
          SELECT tm.game_account_id 
          FROM TEAM_MEMBER tm 
          WHERE tm.is_active = TRUE
        )
    `;

    const queryParams = [];

    if (game_id) {
      sql += ` AND ga.game_id = ?`;
      queryParams.push(game_id);
    }

    if (preferred_role) {
      sql += ` AND LOWER(f.preferred_role) = LOWER(?)`;
      queryParams.push(preferred_role);
    }

    if (university) {
      sql += ` AND ga.university LIKE ?`;
      queryParams.push(`%${university}%`);
    }

    if (search) {
      sql += ` AND (ga.game_username LIKE ? OR ga.game_uid LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY f.free_agent_id DESC`;

    db.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FAILED TO FETCH FREE AGENTS" });
      }

      res.status(200).json({
        freeAgents: results
      });
    });
  });
});

/**
 * GET /api/free-agents/my
 * Get the logged-in user's free agent profiles.
 */
router.get("/my", requireAuth, (req, res) => {
  const userId = req.session.userId;

  const sql = `
    SELECT
      f.free_agent_id,
      ga.account_id,
      ga.game_id,
      g.game_name,
      ga.game_username,
      ga.game_uid,
      ga.server_region,
      f.availability_status,
      f.preferred_role,
      ga.university
    FROM FREE_AGENT_PROFILE f
    JOIN GAME_ACCOUNT ga ON f.game_account_id = ga.account_id
    JOIN GAME g ON ga.game_id = g.game_id
    WHERE ga.user_id = ?
    ORDER BY f.free_agent_id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO FETCH MY FREE AGENT PROFILES" });
    }

    res.status(200).json({
      freeAgents: results
    });
  });
});

/**
 * POST /api/free-agents
 * Create a new free agent profile for a game account.
 */
router.post("/", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { game_account_id, preferred_role } = req.body;

  if (!game_account_id) {
    return res.status(400).json({ error: "GAME ACCOUNT ID IS REQUIRED" });
  }

  // 1. Verify ownership of the game account
  const ownershipSql = `
    SELECT account_id
    FROM GAME_ACCOUNT
    WHERE account_id = ? AND user_id = ?
  `;

  db.query(ownershipSql, [game_account_id, userId], (err, ownershipResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO CHECK GAME ACCOUNT OWNERSHIP" });
    }

    if (ownershipResults.length === 0) {
      return res.status(403).json({ error: "YOU DO NOT OWN THIS GAME ACCOUNT" });
    }

    // 2. Check if the player is already an active team member
    const activeCheckSql = `
      SELECT member_id
      FROM TEAM_MEMBER
      WHERE game_account_id = ? AND is_active = TRUE
    `;

    db.query(activeCheckSql, [game_account_id], (err, activeResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FAILED TO CHECK TEAM MEMBERSHIP STATUS" });
      }

      if (activeResults.length > 0) {
        return res.status(400).json({ error: "YOU ARE ALREADY A MEMBER OF AN ACTIVE TEAM" });
      }

      // 3. Check for existing free agent profile
      const duplicateSql = `
        SELECT free_agent_id
        FROM FREE_AGENT_PROFILE
        WHERE game_account_id = ?
      `;

      db.query(duplicateSql, [game_account_id], (err, duplicateResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "FAILED TO CHECK EXISTING FREE AGENT PROFILE" });
        }

        if (duplicateResults.length > 0) {
          return res.status(409).json({ error: "FREE AGENT PROFILE ALREADY EXISTS FOR THIS GAME ACCOUNT" });
        }

        // 4. Insert Free Agent Profile
        const insertSql = `
          INSERT INTO FREE_AGENT_PROFILE (game_account_id, availability_status, preferred_role)
          VALUES (?, 'available', ?)
        `;

        db.query(insertSql, [game_account_id, preferred_role || null], (err, insertResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "FAILED TO CREATE FREE AGENT PROFILE" });
          }

          // Update GAME_ACCOUNT.is_free_agent = TRUE
          const updateGaSql = `
            UPDATE GAME_ACCOUNT
            SET is_free_agent = TRUE
            WHERE account_id = ?
          `;

          db.query(updateGaSql, [game_account_id], (err) => {
            if (err) {
              console.error(err);
            }

            res.status(201).json({
              message: "FREE AGENT PROFILE CREATED SUCCESSFULLY",
              freeAgentId: insertResults.insertId
            });
          });
        });
      });
    });
  });
});

/**
 * PUT /api/free-agents/:id
 * Update availability status or preferred role of a free agent profile.
 */
router.put("/:id", requireAuth, (req, res) => {
  const freeAgentId = req.params.id;
  const userId = req.session.userId;
  const { availability_status, preferred_role } = req.body;

  if (!availability_status) {
    return res.status(400).json({ error: "AVAILABILITY STATUS IS REQUIRED" });
  }

  // Verify ownership
  const checkSql = `
    SELECT f.free_agent_id, f.game_account_id
    FROM FREE_AGENT_PROFILE f
    JOIN GAME_ACCOUNT ga ON f.game_account_id = ga.account_id
    WHERE f.free_agent_id = ? AND ga.user_id = ?
  `;

  db.query(checkSql, [freeAgentId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO VERIFY PROFILE OWNERSHIP" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "FREE AGENT PROFILE NOT FOUND OR ACCESS DENIED" });
    }

    const gameAccountId = results[0].game_account_id;
    const isBecomingAvailable = availability_status.toLowerCase() === "available";

    // If attempting to set status to 'available', verify not currently in an active team
    if (isBecomingAvailable) {
      const activeCheckSql = `
        SELECT member_id
        FROM TEAM_MEMBER
        WHERE game_account_id = ? AND is_active = TRUE
      `;

      db.query(activeCheckSql, [gameAccountId], (err, activeResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "FAILED TO CHECK TEAM MEMBERSHIP STATUS" });
        }

        if (activeResults.length > 0) {
          return res.status(400).json({ error: "YOU ARE ALREADY A MEMBER OF AN ACTIVE TEAM" });
        }

        executeUpdate();
      });
    } else {
      executeUpdate();
    }

    function executeUpdate() {
      const updateSql = `
        UPDATE FREE_AGENT_PROFILE
        SET availability_status = ?, preferred_role = ?
        WHERE free_agent_id = ?
      `;

      db.query(updateSql, [availability_status, preferred_role || null, freeAgentId], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "FAILED TO UPDATE FREE AGENT PROFILE" });
        }

        const updateGaSql = `
          UPDATE GAME_ACCOUNT
          SET is_free_agent = ?
          WHERE account_id = ?
        `;

        db.query(updateGaSql, [isBecomingAvailable, gameAccountId], (err) => {
          if (err) {
            console.error(err);
          }

          res.status(200).json({
            message: "FREE AGENT PROFILE UPDATED SUCCESSFULLY"
          });
        });
      });
    }
  });
});

/**
 * DELETE /api/free-agents/:id
 * Delete a free agent profile.
 */
router.delete("/:id", requireAuth, (req, res) => {
  const freeAgentId = req.params.id;
  const userId = req.session.userId;

  const checkSql = `
    SELECT f.free_agent_id, f.game_account_id
    FROM FREE_AGENT_PROFILE f
    JOIN GAME_ACCOUNT ga ON f.game_account_id = ga.account_id
    WHERE f.free_agent_id = ? AND ga.user_id = ?
  `;

  db.query(checkSql, [freeAgentId, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "FAILED TO VERIFY PROFILE OWNERSHIP" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "FREE AGENT PROFILE NOT FOUND OR ACCESS DENIED" });
    }

    const gameAccountId = results[0].game_account_id;

    const deleteSql = `
      DELETE FROM FREE_AGENT_PROFILE
      WHERE free_agent_id = ?
    `;

    db.query(deleteSql, [freeAgentId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "FAILED TO DELETE FREE AGENT PROFILE" });
      }

      const updateGaSql = `
        UPDATE GAME_ACCOUNT
        SET is_free_agent = FALSE
        WHERE account_id = ?
      `;

      db.query(updateGaSql, [gameAccountId], (err) => {
        if (err) {
          console.error(err);
        }

        res.status(200).json({
          message: "FREE AGENT PROFILE DELETED SUCCESSFULLY"
        });
      });
    });
  });
});

module.exports = router;
