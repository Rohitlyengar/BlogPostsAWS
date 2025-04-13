const express = require("express");
const { Pool } = require("pg");
const bodyParser = require('body-parser');
const path = require("path");
require('dotenv').config();
const getSecret = require("./awsSecrets");

const app = express();
const PORT = 8080;
let pool;

(async () => {
    try {
        const secret = await getSecret("secret/phone");
        pool = new Pool({
            user: secret['RDS_USERNAME'],
            host: secret['RDS_HOSTNAME'],
            database: secret['RDS_DB_NAME'],
            password: secret['RDS_PASSWORD'],
            port: secret['RDS_POST'],
            ssl: { rejectUnauthorized: false },
        });

        const client = await pool.connect();
        console.log("Connected to PostgreSQL database.");
        await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        client.release();

        app.use(bodyParser.json());
        app.use(express.static(path.join(__dirname, "public")));

        app.get("/", (req, res) => {
            res.sendFile(path.join(__dirname, "public", "index.html"));
        });

        app.get("/posts", async (req, res) => {
            try {
                const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
                res.json(result.rows);
            } catch (err) {
                res.status(500).json({ error: "Internal Server Error" });
                console.error("Error fetching posts:", err);
            }
        });

        app.post("/posts", async (req, res) => {
            const { title, content } = req.body;
            if (!title || !content) return res.status(400).json({ error: "Title and content are required" });

            try {
                const result = await pool.query(
                    "INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *",
                    [title, content]
                );
                res.json(result.rows[0]);
            } catch (err) {
                res.status(500).json({ error: "Internal Server Error" });
                console.error("Error inserting post:", err);
            }
        });

        app.listen(PORT, () => console.log(`Server running on Port: ${PORT}`));
    } catch (error) {
        console.error("Failed to initialize application:", error);
        process.exit(1);
    }
})();
