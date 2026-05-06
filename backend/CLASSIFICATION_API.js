/**
 * Activity Classification API Routes Integration
 * 
 * This file shows how to integrate the activity classification system
 * with Express.js API endpoints.
 */

const express = require('express');
const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivityEnrichment,
  getClassificationStats,
  getActivitiesNeedingReview,
  enrichActivity
} = require('./services/activityService');

const {
  createMatter,
  getAllMatters,
  updateMatterKeywords
} = require('./services/matterService');

/**
 * Set up all classification-related API routes
 * @param {Express.App} app - Express application instance
 */
function setupClassificationRoutes(app) {
  const router = express.Router();

  // ========================================================================
  // ACTIVITY ROUTES
  // ========================================================================

  /**
   * GET /activities
   * Retrieve activities with optional filtering
   * 
   * Query Parameters:
   *   - client: string (filter by classified client)
   *   - taskType: string (filter by task type)
   *   - matter: string (filter by matter code)
   *   - billable: boolean (filter billable status)
   *   - minConfidence: number (0-1, filter by minimum confidence)
   *   - limit: number (max results, default 100)
   *   - sortBy: 'recent' | 'confidence' | 'client' (default: recent)
   * 
   * Example:
   *   GET /activities?client=eskom&billable=true&minConfidence=0.8&limit=50
   */
  router.get('/activities', async (req, res) => {
    try {
      const options = {};

      // Build filter options from query parameters
      if (req.query.client) options.client = req.query.client;
      if (req.query.taskType) options.taskType = req.query.taskType;
      if (req.query.billable !== undefined) {
        options.billable = req.query.billable === 'true' || req.query.billable === '1';
      }
      if (req.query.minConfidence) {
        options.minConfidence = parseFloat(req.query.minConfidence);
      }
      if (req.query.limit) {
        options.limit = Math.min(parseInt(req.query.limit), 1000); // Cap at 1000
      }

      const activities = await getActivities(options);

      // Sort if requested
      if (req.query.sortBy === 'confidence') {
        activities.sort((a, b) => b.confidence - a.confidence);
      } else if (req.query.sortBy === 'client') {
        activities.sort((a, b) => (a.client || '').localeCompare(b.client || ''));
      }

      res.json({
        success: true,
        count: activities.length,
        data: activities
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve activities',
        message: error.message
      });
    }
  });

  /**
   * GET /activities/:id
   * Retrieve a single activity by ID
   */
  router.get('/activities/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = await getActivityById(id);

      if (!activity) {
        return res.status(404).json({
          success: false,
          error: 'Activity not found'
        });
      }

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve activity',
        message: error.message
      });
    }
  });

  /**
   * POST /activities
   * Create a new activity with automatic enrichment
   * 
   * Request Body:
   *   {
   *     type: string (required) - 'email', 'document', 'meeting', etc.
   *     startTime: ISO 8601 timestamp (required)
   *     endTime: ISO 8601 timestamp (required)
   *     source: string - 'outlook', 'gmail', 'file', 'teams', etc.
   *     metadata: object - Activity-specific data (subject, filename, etc.)
   *     skipEnrichment: boolean (optional) - Skip enrichment pipeline
   *   }
   * 
   * Example:
   *   POST /activities
   *   {
   *     "type": "email",
   *     "startTime": "2024-01-15T09:00:00Z",
   *     "endTime": "2024-01-15T09:30:00Z",
   *     "source": "outlook",
   *     "metadata": {
   *       "subject": "Re: Eskom contract review",
   *       "from": "client@eskom.co.za"
   *     }
   *   }
   */
  router.post('/activities', async (req, res) => {
    try {
      // Validate required fields
      const { type, startTime, endTime, source, metadata, skipEnrichment } = req.body;

      if (!type || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['type', 'startTime', 'endTime']
        });
      }

      // Create activity with enrichment
      const activity = await createActivity(
        {
          type,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          source: source || 'manual',
          metadata: metadata || {}
        },
        { skipEnrichment: skipEnrichment === true }
      );

      res.status(201).json({
        success: true,
        message: 'Activity created and enriched',
        data: activity
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to create activity',
        message: error.message
      });
    }
  });

  /**
   * PATCH /activities/:id/enrichment
   * Update activity enrichment data (manual corrections)
   * 
   * Request Body (all optional):
   *   {
   *     client: string,
   *     matter: string,
   *     task_type: string,
   *     billable: boolean,
   *     confidence: number (0-1),
   *     narration: string
   *   }
   * 
   * Example: User manually corrects a misclassified activity
   *   PATCH /activities/1/enrichment
   *   {
   *     "client": "eskom",
   *     "confidence": 0.95,
   *     "narration": "User-corrected narration"
   *   }
   */
  router.patch('/activities/:id/enrichment', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Verify activity exists
      const activity = await getActivityById(id);
      if (!activity) {
        return res.status(404).json({
          success: false,
          error: 'Activity not found'
        });
      }

      // Update enrichment
      const success = await updateActivityEnrichment(id, updates);

      if (success) {
        const updated = await getActivityById(id);
        res.json({
          success: true,
          message: 'Activity enrichment updated',
          data: updated
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update activity',
        message: error.message
      });
    }
  });

  /**
   * POST /activities/batch/enrich
   * Enrich multiple unclassified activities
   * 
   * Request Body:
   *   {
   *     activityIds: number[] - Array of activity IDs to re-enrich
   *   }
   */
  router.post('/activities/batch/enrich', async (req, res) => {
    try {
      const { activityIds } = req.body;

      if (!Array.isArray(activityIds) || activityIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'activityIds must be a non-empty array'
        });
      }

      const results = [];
      for (const id of activityIds) {
        const activity = await getActivityById(id);
        if (activity) {
          const enriched = await enrichActivity(activity);
          results.push({
            id,
            status: 'enriched',
            confidence: enriched.confidence
          });
        } else {
          results.push({
            id,
            status: 'not_found'
          });
        }
      }

      res.json({
        success: true,
        message: `Processed ${results.length} activities`,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Batch enrichment failed',
        message: error.message
      });
    }
  });

  // ========================================================================
  // ANALYTICS & STATS ROUTES
  // ========================================================================

  /**
   * GET /activities/stats/classification
   * Get classification statistics
   * 
   * Returns:
   *   {
   *     total: number,
   *     with_client: number,
   *     with_task_type: number,
   *     billable_count: number,
   *     high_confidence: number,
   *     medium_confidence: number,
   *     low_confidence: number,
   *     avg_confidence: number
   *   }
   */
  router.get('/activities/stats/classification', async (req, res) => {
    try {
      const stats = await getClassificationStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics',
        message: error.message
      });
    }
  });

  /**
   * GET /activities/review/low-confidence
   * Get activities that need review (low confidence)
   * 
   * Query Parameters:
   *   - threshold: number (default 0.5, confidence < threshold)
   *   - limit: number (default 20, max results)
   * 
   * Example:
   *   GET /activities/review/low-confidence?threshold=0.5&limit=20
   */
  router.get('/activities/review/low-confidence', async (req, res) => {
    try {
      const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 0.5;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;

      const activities = await getActivitiesNeedingReview(threshold, limit);

      res.json({
        success: true,
        count: activities.length,
        threshold,
        data: activities
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve activities',
        message: error.message
      });
    }
  });

  // ========================================================================
  // MATTER MANAGEMENT ROUTES
  // ========================================================================

  /**
   * GET /matters
   * Retrieve all matters
   */
  router.get('/matters', async (req, res) => {
    try {
      const matters = await getAllMatters();
      res.json({
        success: true,
        count: matters.length,
        data: matters
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve matters',
        message: error.message
      });
    }
  });

  /**
   * POST /matters
   * Create a new matter
   * 
   * Request Body:
   *   {
   *     clientName: string (required),
   *     matterCode: string (required, must be unique),
   *     description: string,
   *     keywords: string (comma-separated)
   *   }
   */
  router.post('/matters', async (req, res) => {
    try {
      const { clientName, matterCode, description, keywords } = req.body;

      if (!clientName || !matterCode) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['clientName', 'matterCode']
        });
      }

      const matterId = await createMatter(clientName, matterCode, description, keywords);

      res.status(201).json({
        success: true,
        message: 'Matter created',
        data: {
          id: matterId,
          clientName,
          matterCode,
          description,
          keywords
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to create matter',
        message: error.message
      });
    }
  });

  /**
   * PATCH /matters/:id/keywords
   * Update matter keywords (improves matching)
   * 
   * Request Body:
   *   {
   *     keywords: string (comma-separated)
   *   }
   */
  router.patch('/matters/:id/keywords', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { keywords } = req.body;

      if (!keywords) {
        return res.status(400).json({
          success: false,
          error: 'keywords field is required'
        });
      }

      await updateMatterKeywords(id, keywords);

      res.json({
        success: true,
        message: 'Matter keywords updated',
        data: { id, keywords }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update matter',
        message: error.message
      });
    }
  });

  // Register all routes under /api prefix
  app.use('/api', router);
}

/**
 * Health check endpoint with classification system status
 */
function addHealthCheckEndpoint(app) {
  app.get('/health', async (req, res) => {
    try {
      const stats = await getClassificationStats();
      res.json({
        status: 'healthy',
        database: 'connected',
        classification: {
          activities_processed: stats.total,
          average_confidence: (stats.avg_confidence * 100).toFixed(1) + '%',
          billable_activities: stats.billable_count,
          needs_review: stats.low_confidence
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  });
}

/**
 * Error handling middleware
 */
function addErrorHandler(app) {
  app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  });
}

module.exports = {
  setupClassificationRoutes,
  addHealthCheckEndpoint,
  addErrorHandler
};

// ============================================================================
// USAGE IN server.js
// ============================================================================

/*
const { setupClassificationRoutes, addHealthCheckEndpoint } = require('./classificationAPI');

// After creating Express app and connecting database:

// Set up classification routes
setupClassificationRoutes(app);

// Override/enhance health check
addHealthCheckEndpoint(app);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Classification API available at /api/activities`);
});
*/
