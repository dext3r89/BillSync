const express = require('express');
const router = express.Router();
const { getActivities } = require('../services/activityService');
const { convertActivityToBillable, DEFAULT_INCREMENT } = require('../services/billingService');

const DEFAULT_RATE_PER_UNIT = 100;

function normalizeBillable(value) {
  return value === true || value === 1 || value === '1';
}

router.get('/entries', async (req, res) => {
  try {
    const increment = Number(req.query.increment || DEFAULT_INCREMENT);
    const ratePerUnit = Number(req.query.ratePerUnit || DEFAULT_RATE_PER_UNIT);
    const activities = await getActivities({ billable: true });

    const entries = activities
      .filter((activity) => normalizeBillable(activity.billable))
      .map((activity) => {
        const billing = convertActivityToBillable(activity, ratePerUnit, increment);

        return {
          activityId: activity.id,
          client_name: activity.client || 'Unassigned client',
          client: activity.client || 'Unassigned client',
          matter_id: activity.matter || 'Unassigned matter',
          matter: activity.matter || 'Unassigned matter',
          date: activity.start_time ? activity.start_time.split('T')[0] : '',
          taskType: activity.task_type || activity.taskType || activity.type || 'other',
          type: activity.type || activity.task_type || 'other',
          narration: activity.narration || `${activity.type || 'Activity'} work`,
          confidence: Number(activity.confidence || 0),
          isManual: activity.isManual === 1 || activity.isManual === true,
          ...billing
        };
      });

    res.json(entries);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to build billing entries',
      message: error.message
    });
  }
});

module.exports = router;
