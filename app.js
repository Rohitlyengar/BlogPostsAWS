const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

require("dotenv").config();
const getSecret = require("./awsSecrets");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;
let pool;

// Configure multer to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

(async () => {
    try {
        // Apply CORS middleware first, before any route handlers
        app.use(cors({
            origin: '*', // Allow all origins (or specify your domain)
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        
        // Parse JSON requests
        app.use(bodyParser.json());
        
        // Serve static files
        app.use(express.static(path.join(__dirname, "public")));
        
        console.log("Initializing application and connecting to database...");
        const secret = await getSecret("secret/phone");
        
        if (!secret) {
            throw new Error("Failed to retrieve secret from AWS Secrets Manager");
        }
        console.log("Secret retrieved successfully");
        
        pool = new Pool({
            user: secret["RDS_USERNAME"],
            host: secret["RDS_HOSTNAME"],
            database: secret["RDS_DB_NAME"],
            password: secret["RDS_PASSWORD"],
            port: secret["RDS_PORT"],
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

        const s3 = new S3Client({ region: secret["AWS_REGION"] });

        app.post("/posts", upload.single("image"), async (req, res) => {
            console.log(`Received POST request to /posts at: ${new Date().toISOString()}`);
            console.log("Request body:", req.body);
            console.log("File uploaded:", req.file ? "Yes" : "No");
            
            try {
                const { title, content } = req.body;

                if (!title || !content) {
                    console.log("Missing title or content in request");
                    return res.status(400).json({ error: "Title and content are required" });
                }

                let uploadedImageUrl = null;

                if (req.file) {
                    console.log("Processing image upload to S3...");
                    // Upload to S3
                    const fileName = `${Date.now()}-${req.file.originalname}`;
            
                    const uploadParams = {
                        Bucket: secret["S3_BUCKET_NAME"],
                        Key: fileName,
                        Body: req.file.buffer,
                        ContentType: req.file.mimetype
                    };
            
                    try {
                        console.log("Sending request to S3...");
                        await s3.send(new PutObjectCommand(uploadParams));
                        uploadedImageUrl = `https://${secret["S3_BUCKET_NAME"]}.s3.${secret["AWS_REGION"]}.amazonaws.com/${fileName}`;
                        console.log("Successfully uploaded image to S3:", uploadedImageUrl);
                    } catch (err) {
                        console.error("Error uploading to S3:", err.message);
                        console.error("Error Stack:", err.stack);
                        return res.status(500).json({ error: "Error uploading image" });
                    }
                }

                console.log("Inserting post into database...");
                const query = `
                INSERT INTO posts (title, content)
                VALUES ($1, $2) RETURNING *`;
                const values = [title, content];
                const result = await pool.query(query, values);

                console.log("Post created successfully:", result.rows[0]);
                res.json({
                    post: result.rows[0],
                    imageUrl: uploadedImageUrl || "No image uploaded",
                });
            } catch (error) {
                console.error('Error in /posts handler:', error);
                console.error('Error Message:', error.message);
                console.error('Error Stack:', error.stack);
                res.status(500).json({ message: 'Failed to create post', error: error.message });
            }
        });

        app.listen(PORT, () => console.log(`Server running on Port: ${PORT}`));
    } catch (error) {
        console.error("Failed to initialize application:", error);
        process.exit(1);
    }
})();