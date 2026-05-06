const express = require('express');
const router = express.Router();
const {
  createManualActivity,
  getActivities,
  getActivityStats,
  updateActivityEnrichment
} = require('../services/activityService');

router.get('/', async (req, res) => {
  try {
    const activities = await getActivities(req.query);
    res.json(activities);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch activities',
      message: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    res.json(await getActivityStats());
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch activity stats',
      message: error.message
    });
  }
});

router.post('/manual', async (req, res) => {
  try {
    const activity = await createManualActivity(req.body);
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({
      error: 'Failed to create manual activity',
      message: error.message
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.taskType && !updates.task_type) {
      updates.task_type = updates.taskType;
    }

    if (updates.action === 'decline') {
      updates.billable = 0;
      updates.metadata = JSON.stringify({
        reviewAction: 'declined',
        reviewedAt: new Date().toISOString()
      });
    }

    delete updates.action;
    delete updates.taskType;

    const updated = await updateActivityEnrichment(req.params.id, updates);

    if (!updated) {
      return res.status(400).json({ error: 'No valid activity fields supplied' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update activity',
      message: error.message
    });
  }
});

module.exports = router;
