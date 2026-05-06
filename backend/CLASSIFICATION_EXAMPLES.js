/**
 * Activity Classification System - Example Usage
 * 
 * This file demonstrates how to use the AI-assisted activity classification
 * and enrichment system in a real application.
 */

// ============================================================================
// EXAMPLE 1: Basic Activity Creation with Auto-Enrichment
// ============================================================================

const { createActivity, getActivities, getActivityById, getClassificationStats } = require('./services/activityService');
const { createMatter, updateMatterKeywords } = require('./services/matterService');

/**
 * Example: Capture email and let the system classify it
 */
async function exampleEmailCapture() {
  const emailEvent = {
    type: 'email',
    startTime: new Date(),
    endTime: new Date(),
    source: 'outlook',
    metadata: {
      subject: 'Re: Eskom contract review - payment terms',
      from: 'client@eskom.co.za',
      recipients: ['attorney@lawfirm.com'],
      body: 'Please review the attached contract and advise on payment terms...'
    }
  };

  // Create activity - it automatically classifies and enriches
  const enrichedActivity = await createActivity(emailEvent);

  console.log('Created enriched activity:');
  console.log({
    id: enrichedActivity.id,
    type: enrichedActivity.type,
    client: enrichedActivity.client,           // "eskom"
    taskType: enrichedActivity.taskType,       // "email_review" or "document_review"
    billable: enrichedActivity.billable,       // true
    confidence: enrichedActivity.confidence,   // 0.85 (high confidence)
    narration: enrichedActivity.narration       // "Reviewed and responded to email regarding Eskom contract review - payment terms"
  });

  return enrichedActivity;
}

// ============================================================================
// EXAMPLE 2: Document Analysis
// ============================================================================

async function exampleDocumentCapture() {
  const documentEvent = {
    type: 'document',
    startTime: new Date(),
    endTime: new Date(),
    source: 'file',
    metadata: {
      filename: 'Standard_Bank_Loan_Agreement_2024.pdf',
      filesize: 2500000,
      path: '/tracked_files/contracts/',
      createdDate: new Date().toISOString()
    }
  };

  const enrichedActivity = await createActivity(documentEvent);

  console.log('Document enriched activity:');
  console.log({
    id: enrichedActivity.id,
    client: enrichedActivity.client,           // "standard_bank"
    taskType: enrichedActivity.taskType,       // "document_review"
    billable: enrichedActivity.billable,
    confidence: enrichedActivity.confidence,   // 0.9
    narration: enrichedActivity.narration       // "Review of Standard Bank Loan Agreement 2024 document"
  });

  return enrichedActivity;
}

// ============================================================================
// EXAMPLE 3: Matter Management and Setup
// ============================================================================

async function exampleMatterSetup() {
  // Create matters for our key clients
  const eskomMatterId = await createMatter(
    'Eskom',
    'ESKOM-2024-001',
    'Power Purchase Agreement Negotiation',
    'eskom, power, contract, purchase agreement, energy'
  );

  const standardBankMatterId = await createMatter(
    'Standard Bank',
    'SBSA-2024-LOAN',
    'Credit Facility Review',
    'standard bank, banking, loan, credit, facility, sbsa'
  );

  const deloitteMatterId = await createMatter(
    'Deloitte',
    'DELOITTE-2024-AUDIT',
    'Regulatory Compliance Audit',
    'deloitte, audit, compliance, regulatory, consulting'
  );

  console.log('Created matters:');
  console.log({
    eskomMatterId,
    standardBankMatterId,
    deloitteMatterId
  });

  return {
    eskomMatterId,
    standardBankMatterId,
    deloitteMatterId
  };
}

// ============================================================================
// EXAMPLE 4: Batch Activity Processing
// ============================================================================

async function exampleBatchProcessing() {
  const activities = [
    {
      type: 'email',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T09:30:00'),
      source: 'outlook',
      metadata: {
        subject: 'Re: Contract review meeting scheduled',
        body: 'Meeting confirmed for next Tuesday...'
      }
    },
    {
      type: 'document',
      startTime: new Date('2024-01-15T10:00:00'),
      endTime: new Date('2024-01-15T11:30:00'),
      source: 'file',
      metadata: {
        filename: 'ESKOM_ServiceAgreement_Draft_v3.docx'
      }
    },
    {
      type: 'meeting',
      startTime: new Date('2024-01-15T14:00:00'),
      endTime: new Date('2024-01-15T15:00:00'),
      source: 'teams',
      metadata: {
        subject: 'Client call - Eskom procurement review',
        attendees: ['client@eskom.co.za', 'attorney@lawfirm.com']
      }
    }
  ];

  // Process all activities
  const createdActivities = await Promise.all(
    activities.map(activity => createActivity(activity))
  );

  console.log(`Processed ${createdActivities.length} activities`);
  console.log('Classifications:');
  createdActivities.forEach((activity, index) => {
    console.log(`${index + 1}. ${activity.type} - ${activity.taskType} [${(activity.confidence * 100).toFixed(0)}% confidence]`);
  });

  return createdActivities;
}

// ============================================================================
// EXAMPLE 5: Analytics and Reporting
// ============================================================================

async function exampleAnalytics() {
  // Get classification statistics
  const stats = await getClassificationStats();
  console.log('Classification Statistics:');
  console.log({
    total: stats.total,
    withClient: stats.with_client,
    withTaskType: stats.with_task_type,
    billableActivities: stats.billable_count,
    highConfidence: `${stats.high_confidence} (${((stats.high_confidence / stats.total) * 100).toFixed(1)}%)`,
    mediumConfidence: `${stats.medium_confidence} (${((stats.medium_confidence / stats.total) * 100).toFixed(1)}%)`,
    lowConfidence: `${stats.low_confidence} (${((stats.low_confidence / stats.total) * 100).toFixed(1)}%)`,
    averageConfidence: (stats.avg_confidence * 100).toFixed(1) + '%'
  });

  // Get billable activities by client
  const billableActivities = await getActivities({
    billable: true,
    limit: 100
  });

  console.log('\nBillable Activities by Client:');
  const clientCount = {};
  billableActivities.forEach(activity => {
    clientCount[activity.client] = (clientCount[activity.client] || 0) + 1;
  });
  Object.entries(clientCount).forEach(([client, count]) => {
    console.log(`  ${client}: ${count} activities`);
  });

  return stats;
}

// ============================================================================
// EXAMPLE 6: Filtering and Searching
// ============================================================================

async function exampleFiltering() {
  // Get all Eskom-related activities
  const eskomActivities = await getActivities({
    client: 'eskom',
    billable: true,
    limit: 50
  });

  console.log(`Found ${eskomActivities.length} billable Eskom activities`);

  // Get high-confidence activities for specific task type
  const draftingActivities = await getActivities({
    taskType: 'drafting',
    minConfidence: 0.7,
    limit: 20
  });

  console.log(`Found ${draftingActivities.length} high-confidence drafting activities`);

  return {
    eskomActivities,
    draftingActivities
  };
}

// ============================================================================
// EXAMPLE 7: Activity Retrieval and Display
// ============================================================================

async function exampleActivityDisplay() {
  // Get a specific activity
  const activity = await getActivityById(1);

  if (activity) {
    console.log('Activity Details:');
    console.log({
      id: activity.id,
      type: activity.type,
      date: new Date(activity.start_time).toLocaleDateString(),
      time: `${new Date(activity.start_time).toLocaleTimeString()} - ${new Date(activity.end_time).toLocaleTimeString()}`,
      client: activity.client,
      matter: activity.matter,
      taskType: activity.task_type,
      narration: activity.narration,
      billable: activity.billable ? 'Yes' : 'No',
      confidence: `${(activity.confidence * 100).toFixed(0)}%`,
      source: activity.source,
      enrichedAt: new Date(activity.enriched_at).toLocaleString()
    });

    // For display in a UI
    return formatActivityForDisplay(activity);
  }
}

function formatActivityForDisplay(activity) {
  return {
    id: activity.id,
    title: activity.narration,
    client: activity.client,
    matter: activity.matter,
    type: activity.task_type,
    duration: calculateDuration(activity.start_time, activity.end_time),
    billable: activity.billable === 1,
    confident: activity.confidence >= 0.7,
    date: new Date(activity.start_time).toLocaleDateString(),
    tooltip: `${activity.task_type} | ${(activity.confidence * 100).toFixed(0)}% confidence`
  };
}

function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const minutes = (end - start) / (1000 * 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// ============================================================================
// EXAMPLE 8: Custom Classification Updates
// ============================================================================

const { updateActivityEnrichment } = require('./services/activityService');

async function exampleManualCorrection() {
  // User reviews a low-confidence activity and manually corrects it
  const activityId = 1;

  // Update with manual corrections
  const success = await updateActivityEnrichment(activityId, {
    client: 'eskom',           // Manually set correct client
    matter: 'ESKOM-2024-001',  // Specify the matter
    task_type: 'document_review',
    billable: true,
    confidence: 0.95,          // Set high confidence after manual review
    narration: 'Comprehensive review of Eskom Power Purchase Agreement draft v3'
  });

  console.log(`Activity ${activityId} manually corrected: ${success}`);
}

// ============================================================================
// EXAMPLE 9: Integration with Activity Routes
// ============================================================================

// This is how you would integrate with Express routes:

async function setupActivityRoutes(app) {
  // Get all activities with optional filters
  app.get('/activities', async (req, res) => {
    const options = {};
    if (req.query.client) options.client = req.query.client;
    if (req.query.taskType) options.taskType = req.query.taskType;
    if (req.query.billable !== undefined) options.billable = req.query.billable === 'true';
    if (req.query.minConfidence) options.minConfidence = parseFloat(req.query.minConfidence);

    const activities = await getActivities(options);
    res.json(activities);
  });

  // Get classification statistics
  app.get('/activities/stats/classification', async (req, res) => {
    const stats = await getClassificationStats();
    res.json(stats);
  });

  // Get a specific activity
  app.get('/activities/:id', async (req, res) => {
    const activity = await getActivityById(parseInt(req.params.id));
    if (activity) {
      res.json(activity);
    } else {
      res.status(404).json({ error: 'Activity not found' });
    }
  });

  // Create a new activity
  app.post('/activities', async (req, res) => {
    try {
      const enrichedActivity = await createActivity(req.body);
      res.status(201).json(enrichedActivity);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update activity enrichment data
  app.patch('/activities/:id/enrichment', async (req, res) => {
    try {
      const success = await updateActivityEnrichment(parseInt(req.params.id), req.body);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

// ============================================================================
// MAIN: Run Examples
// ============================================================================

async function runExamples() {
  console.log('\n========== Activity Classification System Examples ==========\n');

  try {
    console.log('1. Email Capture Example:');
    await exampleEmailCapture();

    console.log('\n2. Document Analysis Example:');
    await exampleDocumentCapture();

    console.log('\n3. Matter Setup Example:');
    await exampleMatterSetup();

    console.log('\n4. Batch Processing Example:');
    await exampleBatchProcessing();

    console.log('\n5. Analytics Example:');
    await exampleAnalytics();

    console.log('\n6. Filtering Example:');
    await exampleFiltering();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runExamples();

module.exports = {
  exampleEmailCapture,
  exampleDocumentCapture,
  exampleMatterSetup,
  exampleBatchProcessing,
  exampleAnalytics,
  exampleFiltering,
  exampleActivityDisplay,
  exampleManualCorrection,
  setupActivityRoutes
};
