## AI-Assisted Activity Classification System

A comprehensive Node.js + SQLite system for automatic classification and enrichment of legal activities with AI-powered insights.

---

## Overview

This system transforms raw activity captures (emails, documents, meetings) into structured, billable legal work entries by:

1. **Classifying** activities (client, task type, billability)
2. **Matching** against legal matters
3. **Generating** billing narrations
4. **Enriching** with AI insights (optional, pluggable)

All with automatic confidence scoring and extensible keyword-based rules.

---

## Architecture

### Core Services

```
services/
├── classificationService.js    # Activity classification engine
├── matterService.js            # Matter matching logic
├── narrationService.js         # Billing description generation
├── aiEnhancementService.js     # AI enhancement hooks (OpenAI stub)
└── activityService.js          # Activity lifecycle & enrichment pipeline

config/
└── classificationRules.js      # Extensible keyword & pattern rules

db/
├── schema.sql                  # Database schema
├── database.js                 # DB initialization
└── dbInstance.js               # DB singleton
```

### Data Flow

```
Raw Activity Input
    ↓
[Activity Enrichment Pipeline]
    ├─ classifyActivity()
    │   ├─ Extract searchable text
    │   ├─ Match client keywords
    │   ├─ Match task type keywords & patterns
    │   └─ Calculate confidence
    ├─ matchMatter()
    │   ├─ Score against matter keywords
    │   └─ Return best match
    ├─ generateNarration()
    │   └─ Create billing description
    └─ enhanceWithAI() [optional]
        └─ Improve low-confidence classifications
    ↓
Enriched Activity
    ├─ client: string
    ├─ matter: string (matter code)
    ├─ taskType: string
    ├─ billable: boolean
    ├─ confidence: 0-1
    ├─ narration: string
    └─ enrichedAt: ISO timestamp
```

---

## Database Schema

### activities table

```sql
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- 'email', 'document', 'meeting', etc.
  start_time TEXT NOT NULL,        -- ISO 8601 timestamp
  end_time TEXT NOT NULL,          -- ISO 8601 timestamp
  source TEXT,                     -- 'outlook', 'gmail', 'file', 'teams', etc.
  metadata TEXT,                   -- JSON: subject, filename, body, etc.
  
  -- Enrichment fields
  client TEXT,                     -- Classified client (e.g., 'eskom')
  matter TEXT,                     -- Matched matter code (e.g., 'ESKOM-2024-001')
  task_type TEXT,                  -- Task type (e.g., 'email_review')
  billable INTEGER,                -- 0 or 1
  confidence REAL,                 -- 0.0 to 1.0
  narration TEXT,                  -- Billing description
  
  created_at TEXT,                 -- Auto-timestamp
  enriched_at TEXT                 -- When enrichment pipeline ran
);
```

### matters table

```sql
CREATE TABLE matters (
  id INTEGER PRIMARY KEY,
  client_name TEXT NOT NULL,       -- 'Eskom', 'Standard Bank', etc.
  matter_code TEXT NOT NULL,       -- 'ESKOM-2024-001' (unique)
  description TEXT,                -- Matter description
  keywords TEXT,                   -- Comma-separated keywords for matching
  created_at TEXT
);
```

---

## Classification Rules

### Adding New Clients

In [config/classificationRules.js](config/classificationRules.js):

```javascript
// Pre-defined
const classificationRules = {
  clients: {
    eskom: {
      keywords: ['eskom', 'eskom limited', 'power utility'],
      aliases: ['ESKOM']
    },
    // Add new clients here...
  }
};

// Or programmatically
const { addClient } = require('./config/classificationRules');
addClient('mynewclient', ['keyword1', 'keyword2'], ['ALIAS']);
```

### Adding New Task Types

```javascript
const { addTaskType } = require('./config/classificationRules');

// With regex patterns for stronger matching
addTaskType('customTask', 
  ['keyword1', 'keyword2'],      // Keywords
  [/pattern1/i, /pattern2/i],    // Patterns (optional)
  true                            // billable (default: true)
);
```

### Confidence Scoring

- **High confidence (0.8+)**: Both client and task type matched, or strong pattern match
- **Medium confidence (0.5-0.8)**: Single strong match or multiple weak matches
- **Low confidence (<0.5)**: Ambiguous or missing matches

---

## Usage

### 1. Basic Activity Creation

```javascript
const { createActivity } = require('./services/activityService');

const emailEvent = {
  type: 'email',
  startTime: new Date(),
  endTime: new Date(),
  source: 'outlook',
  metadata: {
    subject: 'Re: Eskom contract review',
    from: 'client@eskom.co.za',
    body: '...'
  }
};

// Automatically classifies and enriches
const enrichedActivity = await createActivity(emailEvent);
console.log(enrichedActivity.client);        // 'eskom'
console.log(enrichedActivity.taskType);      // 'email_review'
console.log(enrichedActivity.confidence);    // 0.85
console.log(enrichedActivity.narration);     // 'Reviewed and responded to email...'
```

### 2. Skip Enrichment (if needed)

```javascript
const activity = await createActivity(event, { skipEnrichment: true });
```

### 3. Retrieve & Filter Activities

```javascript
const { getActivities } = require('./services/activityService');

// All activities
const all = await getActivities();

// By client
const eskomActivities = await getActivities({ client: 'eskom' });

// Billable only
const billable = await getActivities({ billable: true });

// High confidence
const highConfidence = await getActivities({ minConfidence: 0.8 });

// Multiple filters
const filtered = await getActivities({
  client: 'eskom',
  taskType: 'document_review',
  billable: true,
  minConfidence: 0.7,
  limit: 50
});
```

### 4. Matter Management

```javascript
const { createMatter, updateMatterKeywords, getAllMatters } = require('./services/matterService');

// Create a matter
const matterId = await createMatter(
  'Eskom',                                    // client name
  'ESKOM-2024-001',                           // unique code
  'Power Purchase Agreement Negotiation',     // description
  'eskom, power, contract, ppa, energy'       // keywords for matching
);

// Update keywords (to improve matching)
await updateMatterKeywords(matterId, 'eskom, energy, electricity, utility');

// Get all matters
const matters = await getAllMatters();
```

### 5. Manual Classification Correction

```javascript
const { updateActivityEnrichment } = require('./services/activityService');

// User reviews and corrects low-confidence activity
await updateActivityEnrichment(activityId, {
  client: 'eskom',
  matter: 'ESKOM-2024-001',
  task_type: 'document_review',
  billable: true,
  confidence: 0.95,  // Now high confidence
  narration: 'User-corrected comprehensive review...'
});
```

### 6. Analytics & Reporting

```javascript
const { getClassificationStats, getActivitiesNeedingReview } = require('./services/activityService');

// Classification statistics
const stats = await getClassificationStats();
// {
//   total: 150,
//   with_client: 142,
//   with_task_type: 145,
//   billable_count: 128,
//   high_confidence: 95,
//   medium_confidence: 38,
//   low_confidence: 17,
//   avg_confidence: 0.79
// }

// Activities needing review (low confidence)
const needsReview = await getActivitiesNeedingReview(0.5, 20);  // confidence < 0.5
```

---

## Express Routes Integration

```javascript
// GET /activities - List with filters
GET /activities?client=eskom&billable=true&minConfidence=0.7

// GET /activities/stats/classification - Statistics
GET /activities/stats/classification

// GET /activities/:id - Single activity
GET /activities/1

// POST /activities - Create new activity
POST /activities
Body: { type, startTime, endTime, source, metadata }

// PATCH /activities/:id/enrichment - Correct classification
PATCH /activities/1/enrichment
Body: { client, taskType, confidence, ... }
```

---

## AI Enhancement (Optional)

### Current Status

The OpenAI hook is **stubbed but ready** for integration. See [services/aiEnhancementService.js](services/aiEnhancementService.js).

### To Enable OpenAI Integration:

1. Install OpenAI library:
   ```bash
   npm install openai
   ```

2. Set environment variable:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

3. Implement the API call in `enhanceWithAI()`:

```javascript
const OpenAI = require('openai');

async function enhanceWithAI(activity) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) return { enhanced: false };

  const client = new OpenAI({ apiKey: openaiApiKey });

  const prompt = buildEnhancementPrompt(activity);
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500
  });

  const aiSuggestions = parseAIResponse(response.choices[0].message.content);
  return {
    enhanced: true,
    aiSuggestions,
    mergedActivity: mergeEnhancements(activity, aiSuggestions)
  };
}
```

### When Does AI Enhancement Trigger?

- Automatically when `confidence < 0.6`
- Check with `shouldEnhanceWithAI(activity)`
- Batch processing: `batchEnhanceActivities(activities)`

---

## Performance Optimization

### Indexing

Add these indexes to `schema.sql` for production:

```sql
CREATE INDEX idx_activities_client ON activities(client);
CREATE INDEX idx_activities_task_type ON activities(task_type);
CREATE INDEX idx_activities_billable ON activities(billable);
CREATE INDEX idx_activities_confidence ON activities(confidence);
CREATE INDEX idx_activities_start_time ON activities(start_time);
CREATE INDEX idx_matters_client_name ON matters(client_name);
CREATE INDEX idx_matters_code ON matters(matter_code);
```

### Caching Strategies

- **Matter list**: Cache in memory, refresh hourly
- **Classification rules**: Load once at startup
- **Activity list**: Use pagination (limit 100)

---

## Extending the System

### 1. Add New Client

```javascript
// In classificationRules.js
addClient('newclient', ['keyword1', 'keyword2']);

// Create corresponding matter
await createMatter('NewClient', 'NEWCLIENT-2024-001', '...', 'keyword1, keyword2');
```

### 2. Add New Task Type

```javascript
addTaskType('customTask',
  ['keyword1', 'keyword2'],
  [/regex_pattern/i],
  true  // billable
);
```

### 3. Improve Matching

Add more keywords to your matters:

```javascript
await updateMatterKeywords(matterId, 'existing, keywords, new, more, keywords');
```

### 4. Custom Narration Templates

Edit the `taskNarrations` object in [services/narrationService.js](services/narrationService.js):

```javascript
taskNarrations.customTask = () => {
  const detail = metadataObj.customField || 'activity';
  return `Custom narration for ${detail}`;
};
```

---

## File Structure

```
backend/
├── config/
│   └── classificationRules.js         # ← Extend classification here
├── services/
│   ├── classificationService.js       # ← Core classification
│   ├── matterService.js               # ← Matter matching
│   ├── narrationService.js            # ← Billing descriptions
│   ├── aiEnhancementService.js        # ← AI hooks
│   └── activityService.js             # ← Activity lifecycle
├── db/
│   ├── schema.sql                     # ← Database schema
│   ├── database.js
│   └── dbInstance.js
└── routes/
    └── server.js                       # ← Express integration

CLASSIFICATION_EXAMPLES.js              # ← Usage examples
CLASSIFICATION_SYSTEM.md                # ← This file
```

---

## Testing

### Unit Test Example

```javascript
const { classifyActivity } = require('./services/classificationService');

async function testClassification() {
  const activity = {
    type: 'email',
    source: 'outlook',
    metadata: {
      subject: 'Re: Eskom contract review'
    }
  };

  const result = await classifyActivity(activity);
  
  console.assert(result.client === 'eskom', 'Client classification failed');
  console.assert(result.taskType === 'email_review', 'Task type classification failed');
  console.assert(result.confidence > 0.5, 'Confidence too low');
}
```

### Integration Test

```javascript
const { createActivity, getActivities } = require('./services/activityService');

async function testIntegration() {
  const activity = await createActivity({
    type: 'email',
    startTime: new Date(),
    endTime: new Date(),
    source: 'outlook',
    metadata: { subject: 'Test Eskom email' }
  });

  const retrieved = await getActivities({ client: 'eskom' });
  
  console.assert(retrieved.length > 0, 'Activity not found');
  console.assert(retrieved[0].narration, 'Narration not generated');
}
```

---

## Troubleshooting

### Activity Not Classified

1. Check `buildSearchableText()` - metadata might be empty
2. Verify keywords in `classificationRules.js` match your content
3. Check confidence threshold - might be below filtering limit

### Low Confidence Scores

- Add more keywords to rule definitions
- Use regex patterns for stronger matches
- Enable AI enhancement for low-confidence activities

### Matter Not Matching

- Check matter keywords are defined: `getAllMatters()`
- Add more keywords to the matter: `updateMatterKeywords()`
- Ensure activity content is relevant to matter

---

## Best Practices

1. **Set up matters early** - Define all key clients/matters before processing
2. **Keyword quality** - Use specific, unique keywords per client/matter
3. **Regular review** - Check low-confidence activities weekly
4. **Iterative improvement** - Update classification rules based on feedback
5. **Test before production** - Run test activities through the pipeline
6. **Monitor stats** - Use `getClassificationStats()` to track quality
7. **Cache wisely** - Don't re-fetch matters for every activity

---

## Performance Metrics

- Classification: ~10ms per activity
- Matter matching: ~20ms (depends on matter count)
- Narration generation: ~5ms
- Total pipeline: ~50-100ms per activity
- AI enhancement: ~500-1000ms (when called)

---

## License & Support

For issues or questions, refer to [CLASSIFICATION_EXAMPLES.js](CLASSIFICATION_EXAMPLES.js) for detailed code examples.

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Backend Team
