# AI-Assisted Activity Classification System - Deployment Checklist

## Pre-Deployment ✓

- [ ] **Review Schema Changes**
  - [ ] Read `backend/db/schema.sql`
  - [ ] Verify new fields in activities table
  - [ ] Verify keywords field in matters table

- [ ] **Review Service Implementations**
  - [ ] Read `services/classificationService.js`
  - [ ] Read `services/matterService.js`
  - [ ] Read `services/narrationService.js`
  - [ ] Read `services/activityService.js`

- [ ] **Review Configuration**
  - [ ] Check `config/classificationRules.js`
  - [ ] Verify default clients match your needs
  - [ ] Verify default task types are appropriate
  - [ ] Consider adding custom clients/task types

- [ ] **Review Documentation**
  - [ ] Read `IMPLEMENTATION_SUMMARY.md`
  - [ ] Skim `CLASSIFICATION_SYSTEM.md`
  - [ ] Review `CLASSIFICATION_EXAMPLES.js`

---

## Development Setup

- [ ] **Install Database Schema**
  ```bash
  # On server startup, schema.sql is automatically executed
  # Verify in db/schema.sql that all fields are present
  ```

- [ ] **Add Classification Rules** (if customizing)
  ```javascript
  // Edit config/classificationRules.js
  // Add any custom clients or task types
  ```

- [ ] **Test Classification Service**
  ```bash
  # Run test activity through classification
  # Verify confidence scores are reasonable
  ```

- [ ] **Set Up Test Matters**
  ```javascript
  // In test script or manually via API
  const { createMatter } = require('./services/matterService');
  
  await createMatter(
    'TestClient',
    'TEST-2024-001',
    'Test matter',
    'test, client, keywords'
  );
  ```

- [ ] **Test API Routes**
  ```bash
  # POST /api/activities
  # GET /api/activities
  # GET /api/activities/stats/classification
  ```

---

## Database Migration

- [ ] **Backup Existing Database**
  ```bash
  cp backend/db/database.sqlite backend/db/database.sqlite.backup
  ```

- [ ] **Apply Schema Changes**
  - [ ] Stop running server
  - [ ] Backup database (done above)
  - [ ] Restart server (schema.sql auto-executes)
  - [ ] Verify database has new tables/columns

- [ ] **Verify Data Integrity**
  ```javascript
  const { getActivities } = require('./services/activityService');
  const activities = await getActivities();
  // Verify existing activities still load correctly
  ```

---

## Integration

- [ ] **Update Express Server** (`backend/routes/server.js`)
  ```javascript
  // Add this after creating app and connecting database:
  const { setupClassificationRoutes } = require('../CLASSIFICATION_API');
  setupClassificationRoutes(app);
  
  console.log('✓ Classification API routes registered');
  ```

- [ ] **Test New Routes**
  ```bash
  GET http://localhost:3000/api/activities
  GET http://localhost:3000/api/matters
  GET http://localhost:3000/api/activities/stats/classification
  ```

- [ ] **Test Activity Creation**
  ```bash
  POST http://localhost:3000/api/activities
  Body: {
    "type": "email",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T09:30:00Z",
    "source": "outlook",
    "metadata": { "subject": "Test email" }
  }
  ```

---

## Testing

- [ ] **Unit Tests**
  - [ ] Test classifyActivity() with various inputs
  - [ ] Test matchMatter() with test matters
  - [ ] Test generateNarration() with different task types
  - [ ] Test confidence scoring

- [ ] **Integration Tests**
  - [ ] Test complete enrichment pipeline
  - [ ] Test activity creation with enrichment
  - [ ] Test activity retrieval with filters
  - [ ] Test manual enrichment corrections

- [ ] **Performance Tests**
  - [ ] Time single activity enrichment (~100ms)
  - [ ] Time 100 activity batch (~10-15 seconds)
  - [ ] Monitor memory usage
  - [ ] Verify database queries are efficient

---

## Configuration

- [ ] **Add Clients to Rules**
  ```javascript
  // In config/classificationRules.js or programmatically
  const { addClient } = require('./config/classificationRules');
  addClient('mynewclient', ['keyword1', 'keyword2']);
  ```

- [ ] **Add Task Types** (if needed)
  ```javascript
  const { addTaskType } = require('./config/classificationRules');
  addTaskType('customTask', ['kw1', 'kw2'], [/pattern/i], true);
  ```

- [ ] **Create Matters** (required for matching)
  ```javascript
  const { createMatter } = require('./services/matterService');
  
  // Create for each client/matter combination
  await createMatter(
    'Client Name',
    'CLIENT-2024-001',
    'Matter description',
    'comma,separated,keywords'
  );
  ```

- [ ] **Update Matter Keywords** (ongoing)
  ```javascript
  // As you see what works/doesn't work
  const { updateMatterKeywords } = require('./services/matterService');
  await updateMatterKeywords(matterId, 'updated, keywords, here');
  ```

---

## Monitoring & Quality

- [ ] **Monitor Classification Quality**
  ```javascript
  // Check stats daily
  const { getClassificationStats } = require('./services/activityService');
  const stats = await getClassificationStats();
  ```

  Target metrics:
  - [ ] 90%+ of activities have client
  - [ ] 90%+ of activities have task type
  - [ ] 85%+ average confidence
  - [ ] <5% needing review (confidence < 0.5)

- [ ] **Review Low-Confidence Activities**
  ```javascript
  const { getActivitiesNeedingReview } = require('./services/activityService');
  const lowConf = await getActivitiesNeedingReview(0.5, 20);
  ```

  - [ ] Check weekly for low-confidence items
  - [ ] Manually correct misclassifications
  - [ ] Identify missing keywords
  - [ ] Update rules based on patterns

- [ ] **Track Classification Improvements**
  - [ ] Graph confidence over time
  - [ ] Monitor client distribution
  - [ ] Track billable % changes
  - [ ] Report on system improvements

---

## Performance Optimization

- [ ] **Add Database Indexes** (production)
  ```sql
  CREATE INDEX idx_activities_client ON activities(client);
  CREATE INDEX idx_activities_task_type ON activities(task_type);
  CREATE INDEX idx_activities_billable ON activities(billable);
  CREATE INDEX idx_activities_confidence ON activities(confidence);
  CREATE INDEX idx_activities_start_time ON activities(start_time);
  CREATE INDEX idx_matters_code ON matters(matter_code);
  ```

- [ ] **Cache Classification Rules**
  - [ ] Rules loaded once at startup
  - [ ] No re-parsing needed per activity

- [ ] **Optimize Queries**
  - [ ] Use pagination (limit 100)
  - [ ] Add filters to reduce result sets
  - [ ] Monitor slow queries

- [ ] **Monitor Performance**
  - [ ] Track enrichment time per activity
  - [ ] Monitor database response times
  - [ ] Check memory usage with large result sets

---

## Future Enhancements

- [ ] **OpenAI Integration** (optional)
  - [ ] Install: `npm install openai`
  - [ ] Set: `OPENAI_API_KEY=sk-...`
  - [ ] Implement API call in `aiEnhancementService.js`
  - [ ] Test with low-confidence activities

- [ ] **Custom Narration Templates** (optional)
  - [ ] Edit `services/narrationService.js`
  - [ ] Add task-specific templates
  - [ ] Test narration quality

- [ ] **Advanced Matching** (optional)
  - [ ] Implement fuzzy matching
  - [ ] Add semantic similarity
  - [ ] Use embeddings for matching

- [ ] **Reporting Dashboard** (optional)
  - [ ] Create visualization of stats
  - [ ] Track trends over time
  - [ ] Generate billing reports

---

## Production Checklist

- [ ] **Security**
  - [ ] No API keys in code
  - [ ] OPENAI_API_KEY only in environment
  - [ ] Input validation on all routes
  - [ ] Error messages don't expose internals

- [ ] **Error Handling**
  - [ ] All async operations have try-catch
  - [ ] Graceful fallbacks for failures
  - [ ] Informative error messages
  - [ ] Error logging to console/file

- [ ] **Documentation**
  - [ ] README updated with new features
  - [ ] API docs up to date
  - [ ] Configuration documented
  - [ ] Deployment steps documented

- [ ] **Testing**
  - [ ] Unit tests passing
  - [ ] Integration tests passing
  - [ ] Load testing completed
  - [ ] Edge cases tested

- [ ] **Deployment**
  - [ ] Database backed up
  - [ ] Staging deployed and tested
  - [ ] Production deployment plan ready
  - [ ] Rollback plan documented

---

## Post-Deployment

- [ ] **Smoke Tests**
  - [ ] Activity creation works
  - [ ] Classification runs
  - [ ] API routes respond
  - [ ] Statistics accurate

- [ ] **Monitor System**
  - [ ] Check application logs
  - [ ] Monitor error rates
  - [ ] Track classification quality
  - [ ] Performance within targets

- [ ] **Gather Feedback**
  - [ ] Review first 100 classified activities
  - [ ] Check for obvious misclassifications
  - [ ] Gather user feedback
  - [ ] Identify improvement opportunities

- [ ] **Iterate**
  - [ ] Update rules based on feedback
  - [ ] Add new clients/matters as needed
  - [ ] Improve narration templates
  - [ ] Enhance keyword lists

---

## Emergency Procedures

If Something Goes Wrong:

1. **Restore Database**
   ```bash
   cp backend/db/database.sqlite.backup backend/db/database.sqlite
   ```

2. **Revert Code**
   ```bash
   git revert <commit-hash>
   npm install
   npm start
   ```

3. **Skip Enrichment** (temporary)
   ```javascript
   // Create activities without enrichment
   await createActivity(event, { skipEnrichment: true });
   ```

4. **Manual Corrections**
   ```javascript
   // Batch fix wrong classifications
   await updateActivityEnrichment(activityId, {...corrections...});
   ```

---

## Success Criteria

✅ **Deployment successful when:**

- [ ] All activities automatically classified
- [ ] 90%+ classification with client
- [ ] 85%+ average confidence
- [ ] <5% requiring manual review
- [ ] API responding in <200ms
- [ ] Database efficient with indexes
- [ ] No error logs related to classification
- [ ] Users satisfied with narrations
- [ ] System performing as expected

---

## Support & Documentation

| Resource | Purpose |
|----------|---------|
| **IMPLEMENTATION_SUMMARY.md** | Overview of what was built |
| **CLASSIFICATION_SYSTEM.md** | Comprehensive reference |
| **CLASSIFICATION_QUICK_REFERENCE.md** | Quick lookup guide |
| **CLASSIFICATION_EXAMPLES.js** | Code examples |
| **CLASSIFICATION_API.js** | API route implementation |

---

## Final Notes

- **Start Small**: Test with a few activities first
- **Monitor Closely**: Watch stats for first week
- **Iterate Quickly**: Update rules based on feedback
- **Document Changes**: Keep notes on rule improvements
- **Plan for Growth**: Design for 1000s of activities

---

**Ready to deploy?** Follow the checklist from top to bottom and you'll have a robust classification system in production!
