import express from 'express';
import db from '../../../../model/db.js';

const router = express.Router();

router.get('/health', async function(req, res) {
    try {
        await db.one('SELECT 1 AS ok');
        res.json({
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: err.message,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
