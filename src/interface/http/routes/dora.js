import express from 'express';
import gitHubMetricsService from '../../../infrastructure/github/GitHubMetricsService.js';
import logger from '../../../infrastructure/logging/Logger.js';

const router = express.Router();

// Dashboard view
router.get('/dashboard/dora', function(req, res) {
  res.render('dora-dashboard', { title: 'DORA Metrics Dashboard' });
});

// API endpoint (serves both the EJS dashboard and Grafana)
router.get('/api/dora/metrics', async function(req, res) {
  try {
    const days = parseInt(req.query.days) || 90;
    const clampedDays = Math.min(Math.max(days, 1), 365);
    const metrics = await gitHubMetricsService.getAllMetrics(clampedDays);
    res.json(metrics);
  } catch (err) {
    logger.error('DORA metrics API error', { error: err.message });
    res.status(502).json({
      error: 'Failed to fetch DORA metrics from GitHub',
      message: err.message
    });
  }
});

export default router;
