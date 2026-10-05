const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
        return res.status(400).json({
            message: "Username, email, password, and role are all required"
        });
    }

    // Validate role is one of the allowed values (defense against direct API calls)
    if (!["player", "organizer"].includes(role)) {
        return res.status(400).json({
            message: "Role must be either 'player' or 'organizer'"
        });
    }

    // Basic password length check
    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO USER
            (username, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [username, email, hashedPassword, role],
            (err, result) => {
                if (err) {
                    console.log(err);

                    // Duplicate entry - figure out exactly which field collided
                    if (err.code === "ER_DUP_ENTRY") {
                        if (err.sqlMessage && err.sqlMessage.includes("email")) {
                            return res.status(409).json({
                                message: "An account with this email already exists"
                            });
                        }
                        if (err.sqlMessage && err.sqlMessage.includes("username")) {
                            return res.status(409).json({
                                message: "This username is already taken"
                            });
                        }
                        return res.status(409).json({
                            message: "An account with these details already exists"
                        });
                    }

                    return res.status(500).json({
                        message: "Failed to create account. Please try again."
                    });
                }

                res.status(201).json({
                    message: "Account created successfully!"
                });
            }
        );

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong. Please try again."
        });
    }
});


router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = `
        SELECT user_id, username, email, password_hash, role, account_status
        FROM USER
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        async (err, results) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Login failed"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = results[0];

            const passwordMatch = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            if (user.account_status !== "active") {
                return res.status(403).json({
                    message: "Your account is not active"
                });
            }

            req.session.userId = user.user_id;

            delete user.password_hash;

            res.status(200).json({
                message: "Login successful!",
                user: user
            });
        }
    );
});


router.get("/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in"
        });
    }

    const sql = `
        SELECT user_id, username, email, role, account_status
        FROM USER
        WHERE user_id = ?
    `;

    db.query(
        sql,
        [req.session.userId],
        (err, results) => {
            if (err) {
                console.log(err);

                return res.status(500).json({
                    message: "Failed to get user"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            res.status(200).json({
                user: results[0]
            });
        }
    );
});


router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Logout failed"
            });
        }

        res.clearCookie("arenax_session");

        res.status(200).json({
            message: "Logout successful!"
        });
    });
});


module.exports = router;