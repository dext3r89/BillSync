/**
 * Activity Service
 * 
 * Handles activity creation with AI-assisted classification and enrichment.
 * Integrates classification, matter matching, and narration services.
 */

const { getDB } = require('../db/dbInstance');
const { classifyActivity } = require('./classificationService');
const { matchMatter } = require('./matterService');
const { generateNarration, generateExtendedNarration } = require('./narrationService');
const { enhanceWithAI, shouldEnhanceWithAI } = require('./aiEnhancementService');

/**
 * Enrich an activity with classification, matter matching, and narration
 * 
 * This is the core enrichment pipeline:
 * 1. Classify activity (client, task type, billability)
 * 2. Match against matters
 * 3. Generate narration
 * 4. Optionally enhance with AI (if low confidence)
 * 
 * @param {object} activity - The raw activity to enrich
 * @returns {Promise<object>} Enriched activity with all classification data
 */
async function enrichActivity(activity) {
  if (!activity) {
    throw new Error('Activity cannot be null or undefined');
  }

  try {
    // Step 1: Classify activity
    const classification = await classifyActivity(activity);

    // Merge classification results into activity
    const enrichedActivity = {
      ...activity,
      client: classification.client,
      taskType: classification.taskType,
      billable: classification.billable,
      confidence: classification.confidence
    };

    // Step 2: Match against matters
    const matterMatch = await matchMatter(enrichedActivity);
    enrichedActivity.matter = matterMatch.matterCode;
    enrichedActivity.matterScore = matterMatch.score;

    // Step 3: Generate narration
    enrichedActivity.narration = generateNarration(enrichedActivity);
    enrichedActivity.extendedNarration = generateExtendedNarration(enrichedActivity);

    // Step 4: Optional AI enhancement for low-confidence activities
    if (shouldEnhanceWithAI(enrichedActivity)) {
      const aiResult = await enhanceWithAI(enrichedActivity);
      enrichedActivity.aiEnhanced = aiResult.enhanced;
      enrichedActivity.aiResult = aiResult;
    }

    // Add enrichment timestamp
    enrichedActivity.enrichedAt = new Date().toISOString();

    return enrichedActivity;
  } catch (error) {
    console.error('Error enriching activity:', error);
    // Return activity with minimal enrichment data if enrichment fails
    return {
      ...activity,
      enrichmentError: error.message,
      confidence: 0,
      enrichedAt: new Date().toISOString()
    };
  }
}

/**
 * Create a new activity with automatic enrichment
 * 
 * @param {object} event - The activity event
 * @param {string} event.type - Activity type (email, document, meeting, etc.)
 * @param {Date} event.startTime - Activity start time
 * @param {Date} event.endTime - Activity end time
 * @param {string} event.source - Source (outlook, gmail, file, etc.)
 * @param {object} event.metadata - Activity metadata (subject, filename, content, etc.)
 * @param {boolean} options.skipEnrichment - Skip enrichment if true (default: false)
 * @returns {Promise<object>} Created activity record
 */
async function createActivity(event, options = {}) {
  const db = getDB();

  try {
    // Prepare base activity
    const baseActivity = {
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime,
      source: event.source,
      metadata: event.metadata
    };

    // Enrich activity unless explicitly skipped
    let enrichedActivity = baseActivity;
    if (!options.skipEnrichment) {
      enrichedActivity = await enrichActivity(baseActivity);
    }

    // Store enriched activity in database
    const result = await db.run(
      `INSERT INTO activities (
        type, 
        start_time, 
        end_time, 
        source, 
        metadata,
        client,
        matter,
        task_type,
        billable,
        confidence,
        narration,
        isManual,
        enriched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        enrichedActivity.type,
        enrichedActivity.startTime instanceof Date
          ? enrichedActivity.startTime.toISOString()
          : enrichedActivity.startTime,
        enrichedActivity.endTime instanceof Date
          ? enrichedActivity.endTime.toISOString()
          : enrichedActivity.endTime,
        enrichedActivity.source,
        typeof enrichedActivity.metadata === 'string'
          ? enrichedActivity.metadata
          : JSON.stringify(enrichedActivity.metadata),
        enrichedActivity.client || null,
        enrichedActivity.matter || null,
        enrichedActivity.taskType || null,
        enrichedActivity.billable ? 1 : 0,
        enrichedActivity.confidence || 0,
        enrichedActivity.narration || null,
        enrichedActivity.isManual ? 1 : 0,
        enrichedActivity.enrichedAt || new Date().toISOString()
      ]
    );

    // Return the created activity with its ID
    return {
      id: result.lastID,
      ...enrichedActivity
    };
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

function normalizeManualType(type) {
  const normalizedType = String(type || '').trim().toLowerCase();

  if (normalizedType === 'sms') {
    return 'SMS';
  }

  if (normalizedType === 'whatsapp') {
    return 'WhatsApp';
  }

  if (normalizedType === 'telephone' || normalizedType === 'call') {
    return 'Call';
  }

  return 'Call';
}

function getManualDurationMinutes(entry, type) {
  if (type !== 'Call') {
    return 0;
  }

  return Math.max(0, Math.ceil(Number(entry.duration || entry.durationMinutes || 0)));
}

function getManualQuantity(entry, type) {
  if (type === 'Call') {
    return 1;
  }

  return Math.max(1, Math.ceil(Number(entry.quantity || 1)));
}

async function createManualActivity(entry) {
  const db = getDB();
  const type = normalizeManualType(entry.type);
  const startTime = entry.date ? new Date(entry.date) : new Date();

  if (Number.isNaN(startTime.getTime())) {
    throw new Error('A valid date is required');
  }

  const durationMinutes = getManualDurationMinutes(entry, type);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  const quantity = getManualQuantity(entry, type);
  const defaultRate = type === 'SMS' || type === 'WhatsApp' ? 40 : null;
  const metadata = {
    manual: true,
    quantity,
    durationMinutes,
    ratePerUnit: Number(entry.ratePerUnit || defaultRate || 0),
    originalType: entry.type || type
  };

  const result = await db.run(
    `INSERT INTO activities (
      type,
      start_time,
      end_time,
      source,
      metadata,
      client,
      matter,
      task_type,
      billable,
      confidence,
      narration,
      isManual,
      enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      type,
      startTime.toISOString(),
      endTime.toISOString(),
      'manual',
      JSON.stringify(metadata),
      entry.client || null,
      entry.matter || null,
      entry.taskType || type,
      1,
      1,
      entry.narration || `${type} activity`,
      1,
      new Date().toISOString()
    ]
  );

  return getActivityById(result.lastID);
}

/**
 * Get all activities, optionally filtered
 * @param {object} options - Filter options
 * @param {string} options.client - Filter by client
 * @param {string} options.taskType - Filter by task type
 * @param {boolean} options.billable - Filter by billable status
 * @param {number} options.minConfidence - Filter by minimum confidence (0-1)
 * @param {number} options.limit - Limit number of results
 * @returns {Promise<object[]>} Array of activities
 */
async function getActivities(options = {}) {
  const db = getDB();

  try {
    let query = 'SELECT * FROM activities WHERE 1=1';
    const params = [];

    // Add filters
    if (options.client) {
      query += ' AND client = ?';
      params.push(options.client);
    }
    if (options.taskType) {
      query += ' AND task_type = ?';
      params.push(options.taskType);
    }
    if (options.billable !== undefined) {
      query += ' AND billable = ?';
      params.push(options.billable ? 1 : 0);
    }
    if (options.minConfidence !== undefined) {
      query += ' AND confidence >= ?';
      params.push(options.minConfidence);
    }

    query += ' ORDER BY start_time DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const activities = await db.all(query, params);
    return activities || [];
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Get a single activity by ID
 * @param {number} id - Activity ID
 * @returns {Promise<object>} Activity record
 */
async function getActivityById(id) {
  const db = getDB();

  try {
    const activity = await db.get(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );
    return activity || null;
  } catch (error) {
    console.error('Error fetching activity:', error);
    return null;
  }
}

/**
 * Update activity enrichment data
 * Useful for manually correcting classifications or updating confidence
 * 
 * @param {number} id - Activity ID
 * @param {object} updates - Fields to update (client, matter, task_type, billable, confidence, narration)
 * @returns {Promise<boolean>} Success status
 */
async function updateActivityEnrichment(id, updates) {
  const db = getDB();

  try {
    const allowedFields = ['client', 'matter', 'task_type', 'billable', 'confidence', 'narration', 'metadata'];
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return false;
    }

    updateValues.push(id);
    const query = `UPDATE activities SET ${updateFields.join(', ')}, enriched_at = CURRENT_TIMESTAMP WHERE id = ?`;

    await db.run(query, updateValues);
    return true;
  } catch (error) {
    console.error('Error updating activity enrichment:', error);
    throw error;
  }
}

async function getActivityStats() {
  const db = getDB();

  try {
    const stats = await db.get(`
      SELECT
        COUNT(CASE WHEN date(start_time) = date('now', 'localtime') THEN 1 END) as totalDailyActivities,
        AVG(confidence) as averageConfidence,
        COALESCE(SUM(
          CASE
            WHEN date(start_time) = date('now', 'localtime')
            THEN (julianday(end_time) - julianday(start_time)) * 24
            ELSE 0
          END
        ), 0) as dailyHours
      FROM activities
    `);

    return {
      totalDailyActivities: stats?.totalDailyActivities || 0,
      averageConfidence: stats?.averageConfidence || 0,
      dailyHours: stats?.dailyHours || 0
    };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    throw error;
  }
}

/**
 * Get activities by classification metrics
 * Useful for analytics and reporting
 * 
 * @returns {Promise<object>} Classification statistics
 */
async function getClassificationStats() {
  const db = getDB();

  try {
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN client IS NOT NULL THEN 1 END) as with_client,
        COUNT(CASE WHEN task_type IS NOT NULL THEN 1 END) as with_task_type,
        COUNT(CASE WHEN billable = 1 THEN 1 END) as billable_count,
        COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_confidence,
        COUNT(CASE WHEN confidence >= 0.5 AND confidence < 0.8 THEN 1 END) as medium_confidence,
        COUNT(CASE WHEN confidence < 0.5 THEN 1 END) as low_confidence,
        AVG(confidence) as avg_confidence
      FROM activities
    `);

    return stats;
  } catch (error) {
    console.error('Error fetching classification stats:', error);
    return null;
  }
}

/**
 * Get activities that need review (low confidence)
 * @param {number} confidenceThreshold - Confidence threshold (default: 0.5)
 * @param {number} limit - Maximum number of results (default: 20)
 * @returns {Promise<object[]>} Low-confidence activities
 */
async function getActivitiesNeedingReview(confidenceThreshold = 0.5, limit = 20) {
  const db = getDB();

  try {
    const activities = await db.all(
      `SELECT * FROM activities 
       WHERE confidence < ? AND confidence > 0
       ORDER BY confidence ASC, start_time DESC
       LIMIT ?`,
      [confidenceThreshold, limit]
    );

    return activities || [];
  } catch (error) {
    console.error('Error fetching activities needing review:', error);
    return [];
  }
}

module.exports = {
  createActivity,
  createManualActivity,
  getActivities,
  getActivityById,
  enrichActivity,
  updateActivityEnrichment,
  getActivityStats,
  getClassificationStats,
  getActivitiesNeedingReview
};
