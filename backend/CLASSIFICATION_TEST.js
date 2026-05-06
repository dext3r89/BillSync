/**
 * Activity Classification System - Comprehensive Test Suite
 * 
 * Tests all major components:
 * - Database schema (new enrichment fields)
 * - Classification service
 * - Matter service
 * - Narration generation
 * - Activity enrichment pipeline
 * - Filtering and analytics
 */

const path = require('path');
const fs = require('fs');

// Setup database
async function initializeTestDB() {
  console.log('\n='.repeat(70));
  console.log('INITIALIZATION: Setting up test database');
  console.log('='.repeat(70));

  const initDB = require('./db/database');
  const { setDB } = require('./db/dbInstance');

  const db = await initDB();
  setDB(db);

  // Load schema
  const schema = fs.readFileSync(path.join(__dirname, './db/schema.sql'), 'utf-8');
  await db.exec(schema);

  console.log('✓ Database initialized');
  console.log('✓ Schema applied with new enrichment fields');

  return db;
}

// Test 1: Classification Service
async function testClassificationService() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Classification Service');
  console.log('='.repeat(70));

  const { classifyActivity } = require('./services/classificationService');

  const testCases = [
    {
      name: 'Email - Eskom message',
      activity: {
        type: 'email',
        source: 'outlook',
        metadata: {
          subject: 'Re: Eskom inquiry regarding services',
          from: 'client@eskom.co.za'
        }
      },
      expectedClient: 'eskom',
      expectedTaskType: 'email_review'
    },
    {
      name: 'Document - Standard Bank agreement',
      activity: {
        type: 'document',
        source: 'file',
        metadata: {
          filename: 'Standard_Bank_Loan_Agreement_2024.pdf',
          path: '/tracked_files/',
          description: 'Banking agreement from Standard Bank'
        }
      },
      expectedClient: 'standard_bank',
      expectedTaskType: 'document_review'
    },
    {
      name: 'Meeting - Deloitte audit',
      activity: {
        type: 'meeting',
        source: 'teams',
        metadata: {
          subject: 'Deloitte regulatory audit meeting',
          attendees: ['auditor@deloitte.com']
        }
      },
      expectedClient: 'deloitte',
      expectedTaskType: 'meeting'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    try {
      const result = await classifyActivity(test.activity);

      const clientMatch = result.client === test.expectedClient;
      const taskTypeMatch = result.taskType === test.expectedTaskType;
      const confidence = result.confidence;

      if (clientMatch && taskTypeMatch) {
        console.log(`✓ ${test.name}`);
        console.log(`  Client: ${result.client} | TaskType: ${result.taskType} | Confidence: ${(confidence * 100).toFixed(0)}%`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        console.log(`  Expected: ${test.expectedClient}/${test.expectedTaskType}`);
        console.log(`  Got: ${result.client}/${result.taskType}`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name} - ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 2: Matter Service
async function testMatterService() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Matter Service');
  console.log('='.repeat(70));

  const { createMatter, getAllMatters, updateMatterKeywords, matchMatter } = require('./services/matterService');

  let passed = 0;
  let failed = 0;

  try {
    // Create test matters
    console.log('\nCreating test matters...');
    const eskomMatterId = await createMatter(
      'Eskom',
      'ESKOM-2024-001',
      'Power Purchase Agreement Negotiation',
      'eskom, power, contract, ppa, energy'
    );
    console.log(`✓ Created Eskom matter (ID: ${eskomMatterId})`);
    passed++;

    const sbMatterId = await createMatter(
      'Standard Bank',
      'SBSA-2024-LOAN',
      'Credit Facility Review',
      'standard bank, banking, loan, credit facility'
    );
    console.log(`✓ Created Standard Bank matter (ID: ${sbMatterId})`);
    passed++;

    const deloitteMatterId = await createMatter(
      'Deloitte',
      'DELOITTE-2024-AUDIT',
      'Regulatory Compliance Audit',
      'deloitte, audit, compliance, regulatory'
    );
    console.log(`✓ Created Deloitte matter (ID: ${deloitteMatterId})`);
    passed++;

    // Test retrieval
    console.log('\nRetrieving all matters...');
    const matters = await getAllMatters();
    console.log(`✓ Retrieved ${matters.length} matters`);
    if (matters.length >= 3) {
      passed++;
    } else {
      console.log(`✗ Expected at least 3 matters, got ${matters.length}`);
      failed++;
    }

    // Test matter matching
    console.log('\nTesting matter matching...');
    const testActivity = {
      type: 'email',
      source: 'outlook',
      metadata: {
        subject: 'Eskom power purchase agreement review',
        body: 'Please review the contract terms'
      },
      client: 'eskom'
    };

    const match = await matchMatter(testActivity, matters);
    console.log(`✓ Matched to: ${match.matterCode} (score: ${(match.score * 100).toFixed(0)}%)`);
    if (match.matterCode === 'ESKOM-2024-001') {
      passed++;
    } else {
      console.log(`✗ Expected ESKOM-2024-001, got ${match.matterCode}`);
      failed++;
    }

    // Test keyword update
    console.log('\nUpdating matter keywords...');
    await updateMatterKeywords(eskomMatterId, 'eskom, energy, power, electricity, utility, renewable');
    console.log(`✓ Updated Eskom matter keywords`);
    passed++;

  } catch (error) {
    console.log(`✗ Error in matter service: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 3: Narration Service
async function testNarrationService() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Narration Generation Service');
  console.log('='.repeat(70));

  const { generateNarration, generateExtendedNarration } = require('./services/narrationService');

  let passed = 0;
  let failed = 0;

  try {
    const testCases = [
      {
        name: 'Email narration',
        activity: {
          type: 'email',
          taskType: 'email_review',
          client: 'eskom',
          metadata: { subject: 'Contract review and approval' }
        }
      },
      {
        name: 'Document narration',
        activity: {
          type: 'document',
          taskType: 'document_review',
          client: 'standard_bank',
          metadata: { filename: 'Loan_Agreement_2024.pdf' }
        }
      },
      {
        name: 'Meeting narration',
        activity: {
          type: 'meeting',
          taskType: 'meeting',
          client: 'deloitte',
          metadata: { subject: 'Compliance audit kickoff', attendees: ['auditor@deloitte.com'] }
        }
      }
    ];

    console.log('\nGenerating narrations...\n');

    for (const test of testCases) {
      try {
        const narration = generateNarration(test.activity);
        const extended = generateExtendedNarration(test.activity);

        console.log(`✓ ${test.name}`);
        console.log(`  Short: "${narration}"`);
        console.log(`  Extended: "${extended}"\n`);
        passed++;
      } catch (error) {
        console.log(`✗ ${test.name}: ${error.message}\n`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`✗ Error in narration service: ${error.message}`);
    failed++;
  }

  console.log(`Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 4: Activity Enrichment Pipeline
async function testActivityEnrichment() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Activity Enrichment Pipeline');
  console.log('='.repeat(70));

  const { createActivity, getActivityById, enrichActivity } = require('./services/activityService');

  let passed = 0;
  let failed = 0;

  try {
    const testActivities = [
      {
        name: 'Email activity',
        data: {
          type: 'email',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T09:30:00'),
          source: 'outlook',
          metadata: {
            subject: 'Re: Eskom power purchase agreement',
            from: 'client@eskom.co.za'
          }
        }
      },
      {
        name: 'Document activity',
        data: {
          type: 'document',
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T11:30:00'),
          source: 'file',
          metadata: {
            filename: 'ESKOM_ServiceAgreement_Draft_v3.docx'
          }
        }
      },
      {
        name: 'Meeting activity',
        data: {
          type: 'meeting',
          startTime: new Date('2024-01-15T14:00:00'),
          endTime: new Date('2024-01-15T15:00:00'),
          source: 'teams',
          metadata: {
            subject: 'Client call - Eskom procurement review',
            attendees: ['client@eskom.co.za', 'attorney@lawfirm.com']
          }
        }
      }
    ];

    console.log('\nCreating activities with auto-enrichment...\n');

    const createdIds = [];
    for (const test of testActivities) {
      try {
        const enriched = await createActivity(test.data);

        console.log(`✓ ${test.name}`);
        console.log(`  ID: ${enriched.id}`);
        console.log(`  Client: ${enriched.client || 'N/A'}`);
        console.log(`  Task Type: ${enriched.taskType || 'N/A'}`);
        console.log(`  Billable: ${enriched.billable}`);
        console.log(`  Confidence: ${(enriched.confidence * 100).toFixed(0)}%`);
        console.log(`  Matter: ${enriched.matter || 'N/A'}`);
        console.log(`  Narration: "${enriched.narration}"\n`);

        createdIds.push(enriched.id);
        passed++;
      } catch (error) {
        console.log(`✗ ${test.name}: ${error.message}\n`);
        failed++;
      }
    }

    // Test retrieval
    console.log('Testing activity retrieval...\n');
    for (const id of createdIds) {
      try {
        const activity = await getActivityById(id);
        if (activity && activity.id === id) {
          console.log(`✓ Retrieved activity ${id}`);
          passed++;
        } else {
          console.log(`✗ Failed to retrieve activity ${id}`);
          failed++;
        }
      } catch (error) {
        console.log(`✗ Error retrieving activity ${id}: ${error.message}`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`✗ Error in enrichment pipeline: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test 5: Filtering and Analytics
async function testFilteringAndAnalytics() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 5: Filtering and Analytics');
  console.log('='.repeat(70));

  const { getActivities, getClassificationStats, getActivitiesNeedingReview } = require('./services/activityService');

  let passed = 0;
  let failed = 0;

  try {
    // Test filtering
    console.log('\nTesting filters...\n');

    const allActivities = await getActivities({ limit: 100 });
    console.log(`✓ Retrieved all activities: ${allActivities.length} total`);
    passed++;

    const eskomActivities = await getActivities({ client: 'eskom', limit: 100 });
    console.log(`✓ Eskom activities: ${eskomActivities.length}`);
    passed++;

    const billableActivities = await getActivities({ billable: true, limit: 100 });
    console.log(`✓ Billable activities: ${billableActivities.length}`);
    passed++;

    const highConfidence = await getActivities({ minConfidence: 0.7, limit: 100 });
    console.log(`✓ High confidence (0.7+): ${highConfidence.length}`);
    passed++;

    // Test analytics
    console.log('\nTesting analytics...\n');

    const stats = await getClassificationStats();
    if (stats) {
      console.log(`✓ Classification Statistics:`);
      console.log(`  Total activities: ${stats.total}`);
      console.log(`  With client: ${stats.with_client}`);
      console.log(`  With task type: ${stats.with_task_type}`);
      console.log(`  Billable: ${stats.billable_count}`);
      console.log(`  High confidence (0.8+): ${stats.high_confidence}`);
      console.log(`  Medium confidence (0.5-0.8): ${stats.medium_confidence}`);
      console.log(`  Low confidence (<0.5): ${stats.low_confidence}`);
      console.log(`  Average confidence: ${(stats.avg_confidence * 100).toFixed(1)}%`);
      passed++;
    } else {
      console.log(`✗ Failed to retrieve statistics`);
      failed++;
    }

    // Test low confidence review
    console.log('\nTesting low-confidence review...\n');

    const needsReview = await getActivitiesNeedingReview(0.5, 20);
    console.log(`✓ Activities needing review (confidence < 0.5): ${needsReview.length}`);
    if (needsReview.length > 0) {
      console.log(`  First activity:`);
      console.log(`    Client: ${needsReview[0].client || 'N/A'}`);
      console.log(`    Confidence: ${(needsReview[0].confidence * 100).toFixed(0)}%`);
    }
    passed++;

  } catch (error) {
    console.log(`✗ Error in filtering/analytics: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '█'.repeat(70));
  console.log('█' + ' '.repeat(68) + '█');
  console.log('█' + '  ACTIVITY CLASSIFICATION SYSTEM - TEST SUITE'.padEnd(68) + '█');
  console.log('█' + ' '.repeat(68) + '█');
  console.log('█'.repeat(70));

  const results = {
    test1: { name: 'Classification Service', passed: 0, failed: 0 },
    test2: { name: 'Matter Service', passed: 0, failed: 0 },
    test3: { name: 'Narration Service', passed: 0, failed: 0 },
    test4: { name: 'Activity Enrichment', passed: 0, failed: 0 },
    test5: { name: 'Filtering & Analytics', passed: 0, failed: 0 }
  };

  try {
    // Initialize database
    await initializeTestDB();

    // Run all tests
    Object.assign(results.test1, await testClassificationService());
    Object.assign(results.test2, await testMatterService());
    Object.assign(results.test3, await testNarrationService());
    Object.assign(results.test4, await testActivityEnrichment());
    Object.assign(results.test5, await testFilteringAndAnalytics());

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));

    let totalPassed = 0;
    let totalFailed = 0;

    for (const [key, result] of Object.entries(results)) {
      const status = result.failed === 0 ? '✓' : '✗';
      console.log(`${status} ${result.name.padEnd(30)}: ${result.passed} passed, ${result.failed} failed`);
      totalPassed += result.passed;
      totalFailed += result.failed;
    }

    console.log('='.repeat(70));
    console.log(`\nTOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
    } else {
      console.log(`\n⚠️  ${totalFailed} test(s) failed. See details above.`);
    }

    console.log('\n' + '█'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
