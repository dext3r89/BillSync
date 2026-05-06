## Activity Classification System - Quick Reference Guide

### Core Concepts

| Term | Meaning |
|------|---------|
| **Activity** | Raw event (email, document, meeting) to be classified |
| **Enrichment** | Process of adding client, task type, and billing data |
| **Matter** | Legal matter/case with associated keywords |
| **Confidence** | Classification certainty score (0.0 - 1.0) |
| **Narration** | Billing description for time entry |

---

## Quick Start

### 1. Initialize Database
```javascript
// server.js already does this
const initDB = require('../db/database');
const { setDB } = require('../db/dbInstance');

const db = await initDB();
setDB(db);
const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
await db.exec(schema);
```

### 2. Set Up Matters (One-Time)
```javascript
const { createMatter } = require('./services/matterService');

await createMatter(
  'Eskom',
  'ESKOM-2024-001',
  'Description',
  'eskom, power, contract, energy'
);
```

### 3. Create Activity (Automatic Enrichment)
```javascript
const { createActivity } = require('./services/activityService');

const activity = await createActivity({
  type: 'email',
  startTime: new Date(),
  endTime: new Date(),
  source: 'outlook',
  metadata: { subject: 'Eskom review' }
});

// Returns enriched activity with client, taskType, confidence, narration
```

### 4. Query Activities
```javascript
const { getActivities } = require('./services/activityService');

// Get all Eskom activities
const activities = await getActivities({ client: 'eskom' });

// Get high-confidence, billable activities
const ready = await getActivities({ billable: true, minConfidence: 0.8 });

// Get activities needing review
const needsReview = await getActivitiesNeedingReview(0.5, 20);
```

---

## Common Tasks

### ✅ Create an Activity with Auto-Classification
```javascript
const { createActivity } = require('./services/activityService');

const enriched = await createActivity({
  type: 'email',
  startTime: new Date('2024-01-15T09:00:00'),
  endTime: new Date('2024-01-15T09:30:00'),
  source: 'outlook',
  metadata: {
    subject: 'Re: Eskom contract - payment terms',
    from: 'client@eskom.co.za'
  }
});

console.log(enriched.client);      // 'eskom'
console.log(enriched.taskType);    // 'email_review'
console.log(enriched.confidence);  // 0.85
console.log(enriched.narration);   // 'Reviewed and responded to email...'
```

### ✅ Add New Matter
```javascript
const { createMatter } = require('./services/matterService');

const id = await createMatter(
  'Standard Bank',
  'SBSA-2024-LOAN',
  'Credit facility review',
  'standard bank, sbsa, banking, loan, credit facility'
);
```

### ✅ Improve Matter Matching
```javascript
const { updateMatterKeywords } = require('./services/matterService');

// Add more keywords to help matching
await updateMatterKeywords(matterId, 'standard bank, sbsa, banking, loan, credit, facility, financing');
```

### ✅ Fix Low-Confidence Activity
```javascript
const { updateActivityEnrichment } = require('./services/activityService');

// User manually reviewed and corrected
await updateActivityEnrichment(activityId, {
  client: 'eskom',
  matter: 'ESKOM-2024-001',
  taskType: 'document_review',
  confidence: 0.95
});
```

### ✅ Get Classification Stats
```javascript
const { getClassificationStats } = require('./services/activityService');

const stats = await getClassificationStats();
// {
//   total: 150,
//   with_client: 142,
//   high_confidence: 95,
//   avg_confidence: 0.79
// }
```

### ✅ Add New Classification Rule
```javascript
const { addClient, addTaskType } = require('./config/classificationRules');

// Add client
addClient('mynewco', ['mynewco', 'new company']);

// Add task type
addTaskType('compliance_review', 
  ['compliance', 'audit', 'regulatory'],
  [/compliance|audit/i],
  true  // billable
);
```

### ✅ Get Activities for Billing
```javascript
const { getActivities } = require('./services/activityService');

// Get all billable activities
const billable = await getActivities({ billable: true, limit: 500 });

// Group by client for invoicing
const byClient = {};
billable.forEach(activity => {
  if (!byClient[activity.client]) byClient[activity.client] = [];
  byClient[activity.client].push(activity);
});
```

---

## API Endpoints (Express Routes)

```bash
# List activities with filters
GET /activities?client=eskom&billable=true&minConfidence=0.8

# Get single activity
GET /activities/1

# Create activity (auto-enriches)
POST /activities
Body: {
  type: 'email',
  startTime: '2024-01-15T09:00:00',
  endTime: '2024-01-15T09:30:00',
  source: 'outlook',
  metadata: { subject: 'Test' }
}

# Correct classification
PATCH /activities/1/enrichment
Body: {
  client: 'eskom',
  taskType: 'document_review',
  confidence: 0.95
}

# Get stats
GET /activities/stats/classification
```

---

## Metadata Examples

### Email
```javascript
{
  type: 'email',
  source: 'outlook',
  metadata: {
    subject: 'Re: Contract Review',
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    body: '...',
    timestamp: '2024-01-15T09:00:00Z'
  }
}
```

### Document
```javascript
{
  type: 'document',
  source: 'file',
  metadata: {
    filename: 'Agreement_2024.pdf',
    path: '/tracked_files/',
    filesize: 2500000,
    createdDate: '2024-01-15T09:00:00Z'
  }
}
```

### Meeting
```javascript
{
  type: 'meeting',
  source: 'teams',
  metadata: {
    subject: 'Client call - Eskom procurement',
    attendees: ['client@eskom.co.za', 'attorney@lawfirm.com'],
    duration: 3600,  // seconds
    description: 'Discussed project status...'
  }
}
```

---

## Classification Rules

### Default Clients
```
eskom: ['eskom', 'power utility', 'electricity']
standard_bank: ['standard bank', 'sbsa', 'banking']
deloitte: ['deloitte', 'consulting', 'audit']
sasol: ['sasol', 'fuel', 'energy']
```

### Default Task Types
```
email_review: emails, outlook, gmail, messages
document_review: pdf, docx, contracts, agreements
meeting: meetings, calls, teams, zoom, interviews
research: legal research, case law, precedent
drafting: drafting, writing, memos, briefs
administration: admin, filing, scheduling
billing: invoices, docketing, billing
```

---

## Confidence Levels

| Score | Level | Meaning |
|-------|-------|---------|
| 0.9-1.0 | **Very High** | Strong match, action ready |
| 0.8-0.9 | **High** | Confident classification |
| 0.5-0.8 | **Medium** | Needs verification |
| 0.2-0.5 | **Low** | Likely needs correction |
| <0.2 | **Very Low** | Insufficient data |

---

## Troubleshooting Table

| Problem | Solution |
|---------|----------|
| Activity not classified | Check metadata has subject/filename, verify keywords exist |
| Wrong client detected | Add negative keywords or update matter keywords |
| Low confidence | Increase keyword count, add regex patterns, check metadata |
| Matter not matching | Verify matter keywords defined, add more keywords |
| Narration is generic | Check task type classification, improve metadata |

---

## File Locations

```
backend/
├── config/classificationRules.js    ← Edit: Add clients, task types
├── services/
│   ├── classificationService.js     ← Classification logic
│   ├── matterService.js             ← Matter matching
│   ├── narrationService.js          ← Narration templates
│   ├── activityService.js           ← Main activity API
│   └── aiEnhancementService.js      ← AI hooks (stub)
├── db/schema.sql                    ← Database schema
└── CLASSIFICATION_SYSTEM.md         ← Full documentation
```

---

## Performance Tips

1. **Batch operations**: Process multiple activities together
2. **Index matters**: Create matter_code index for faster matching
3. **Cache rules**: Load classification rules once at startup
4. **Lazy load metadata**: Only parse JSON when needed
5. **Pagination**: Use limit for large result sets

---

## Code Examples

### Retrieve Activity and Format for UI
```javascript
const activity = await getActivityById(1);
const formatted = {
  id: activity.id,
  title: activity.narration,
  client: activity.client,
  matter: activity.matter,
  date: new Date(activity.start_time).toLocaleDateString(),
  duration: calculateMinutes(activity.start_time, activity.end_time),
  billable: activity.billable === 1,
  confident: activity.confidence >= 0.7
};
```

### Filter Activities by Date Range
```javascript
const activities = await getActivities();
const filtered = activities.filter(a => {
  const date = new Date(a.start_time);
  return date >= startDate && date <= endDate;
});
```

### Calculate Billable Hours
```javascript
const billable = await getActivities({ billable: true });
const totalMinutes = billable.reduce((sum, a) => {
  const start = new Date(a.start_time);
  const end = new Date(a.end_time);
  return sum + (end - start) / (1000 * 60);
}, 0);
const totalHours = totalMinutes / 60;
```

---

## Environment Variables (Optional)

```bash
# For AI enhancement (when ready)
OPENAI_API_KEY=sk-...

# Database
DB_PATH=./db/database.sqlite

# Classification
CONFIDENCE_THRESHOLD=0.5
LOW_CONFIDENCE_THRESHOLD=0.2
```

---

**Need more help?** See [CLASSIFICATION_EXAMPLES.js](CLASSIFICATION_EXAMPLES.js) for detailed code examples.
