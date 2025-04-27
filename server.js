import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './src/js/services/dbConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(join(__dirname)));

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ status: 'healthy', timestamp: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// User endpoints
app.post('/api/users/register', async (req, res) => {
    console.log('Registration request received:', req.body);
    const { username, email, password_hash } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [username, email, password_hash]
        );
        await pool.query(
            'INSERT INTO user_stats (user_id) VALUES ($1)',
            [result.rows[0].id]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(400).json({ error: err.message });
    }
});

// Friend management endpoints
app.post('/api/friends/request', async (req, res) => {
    const { user_id, friend_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3) RETURNING id',
            [user_id, friend_id, 'pending']
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/friends/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT u.id, u.username, f.status, f.id as friendship_id
            FROM friendships f
            JOIN users u ON (f.friend_id = u.id AND f.user_id = $1) 
                OR (f.user_id = u.id AND f.friend_id = $1)
            WHERE f.status = 'accepted'`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/friends/pending/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT u.id, u.username, f.id as friendship_id
            FROM friendships f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = $1 AND f.status = 'pending'`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/friends/:id/respond', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/users/search', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await pool.query(
            'SELECT id, username FROM users WHERE username ILIKE $1 LIMIT 10',
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Stats endpoints
app.post('/api/stats/record-game', async (req, res) => {
    const { userId, gameType, score, metadata } = req.body;

    try {
        const query = `
            INSERT INTO game_stats (user_id, game_type, score, metadata, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `;
        await pool.query(query, [userId, gameType, score, metadata]);
        res.status(201).send({ message: 'Game stats recorded successfully' });
    } catch (error) {
        console.error('Error recording game stats:', error);
        res.status(500).send({ error: 'Failed to record game stats' });
    }
});

app.get('/api/stats/:gameType/:userId', async (req, res) => {
    const { gameType, userId } = req.params;

    try {
        const query = `
            SELECT * FROM game_stats
            WHERE user_id = $1 AND game_type = $2
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId, gameType]);
        res.status(200).send(result.rows);
    } catch (error) {
        console.error('Error fetching game stats:', error);
        res.status(500).send({ error: 'Failed to fetch game stats' });
    }
});

app.get('/api/stats/leaderboard/:gameType', async (req, res) => {
    const { gameType } = req.params;
    const limit = req.query.limit || 10;

    try {
        const query = `
            SELECT user_id, MAX(score) AS high_score
            FROM game_stats
            WHERE game_type = $1
            GROUP BY user_id
            ORDER BY high_score DESC
            LIMIT $2
        `;
        const result = await pool.query(query, [gameType, limit]);
        res.status(200).send(result.rows);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
