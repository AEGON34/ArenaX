const mysql = require("mysql2");

const db = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "ArenaX",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("MariaDB Pool created successfully!");
// Ensure assigned_role column exists in TEAM_MEMBER
db.query(
    "ALTER TABLE TEAM_MEMBER ADD COLUMN assigned_role VARCHAR(30) NULL DEFAULT NULL",
    (err) => {
        if (err && err.code !== "ER_DUP_FIELDNAME") {
            // Ignore duplicate column error
        }
    }
);

module.exports = db;