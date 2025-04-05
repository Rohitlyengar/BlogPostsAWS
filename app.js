const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const path = require("path");

require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 80

const pool = new Pool({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT,
    ssl: { rejectUnauthorized: false }
});

console.log("Connecting to PostgreSQL database at host:", process.env.RDS_HOSTNAME);


(async () => {
    try {
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
    } catch (err) {
        console.error("Error connecting to PostgreSQL database:", err);
    }
})();

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
        const result = await pool.query("INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *", [title, content]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error inserting post:", err);
    }
});

app.listen(PORT, () => console.log(`Server running on Port: ${PORT}`));