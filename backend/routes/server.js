require('dotenv').config(); // Load environment variables

const express = require('express');
const fs = require('fs');
const path = require('path');
const initDB = require('../db/database');
const { setDB } = require('../db/dbInstance');
const activityRoutes = require('./activityRoutes');
const authRoutes = require('./authRoutes');
const billingRoutes = require('./billingRoutes');
const watcher = require('../documentservice'); // Initialize file watcher
const {
  initializeMsal,
  isAuthenticated
} = require('../services/microsoftAuthService');
const { startOutlookPolling } = require('../services/outlookService');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

let db;
let outlookPollingInterval;

async function ensureActivityColumns(database) {
  const columns = await database.all('PRAGMA table_info(activities)');
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('isManual')) {
    await database.exec('ALTER TABLE activities ADD COLUMN isManual INTEGER DEFAULT 0');
  }
}

async function startServer() {
  // Initialize database
  db = await initDB();
  setDB(db);

  // Load schema
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
  await db.exec(schema);
  await ensureActivityColumns(db);

  console.log('✓ Database initialized');
  console.log('✓ File watcher started - monitoring ./tracked_files');

  // Initialize Microsoft authentication
  const msalInitialized = initializeMsal();
  if (!msalInitialized) {
    console.warn('⚠ MSAL not initialized - Microsoft Graph integration disabled');
  }

  // Register routes
  app.use('/activities', activityRoutes);
  app.use('/billing', billingRoutes);
  app.use('/auth', authRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    const watchedPaths = watcher?.getWatched ? watcher.getWatched() : {};
    const watcherActive = Object.keys(watchedPaths).length > 0;

    res.json({
      status: 'healthy',
      database: 'connected',
      microsoftAuth: msalInitialized ? 'configured' : 'disabled',
      outlookPolling: isAuthenticated() ? 'active' : 'inactive',
      documentTracker: watcherActive ? 'active' : 'inactive'
    });
  });

  // Endpoint to manually trigger Outlook polling
  app.post('/sync/outlook', async (req, res) => {
    try {
      if (!isAuthenticated()) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'Please authenticate with Microsoft first'
        });
      }

      const { pollOutlookData } = require('../services/outlookService');
      await pollOutlookData();

      res.json({
        success: true,
        message: 'Outlook sync completed'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Sync failed',
        message: error.message
      });
    }
  });

  // Start server
  app.listen(3001, () => {
    console.log('🚀 Server running on http://localhost:3001');
    console.log('\n📚 Available endpoints:');
    console.log('   GET  /health                    - Server health check');
    console.log('   GET  /auth/microsoft            - Login with Microsoft');
    console.log('   GET  /auth/status               - Check auth status');
    console.log('   POST /auth/logout               - Logout');
    console.log('   GET  /activities                - List all activities');
    console.log('   GET  /activities/stats          - Activity dashboard stats');
    console.log('   POST /activities/manual         - Create manual activity');
    console.log('   GET  /billing/entries           - List billable entries');
    console.log('   POST /sync/outlook              - Manually sync Outlook data');
    console.log('\n💡 To enable Outlook polling, set environment variables:');
    console.log('   MS_CLIENT_ID, MS_CLIENT_SECRET, REDIRECT_URI');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

module.exports = () => db;
