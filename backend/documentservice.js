const chokidar = require('chokidar');
const { createActivity } = require('./services/activityService');
const path = require('path');

const watcher = chokidar.watch(path.join(__dirname, '../tracked_files'), {
  persistent: true,
  ignoreInitial: true
});

const activeSessions = {};

// Idle detection interval (check every 30 seconds)
setInterval(() => {
  const now = new Date();

  Object.keys(activeSessions).forEach((filePath) => {
    const session = activeSessions[filePath];
    const idleTime = now - session.lastActivity;

    // If no activity for 2 minutes, end session
    if (idleTime > 2 * 60 * 1000) {
      createDocumentEvent(filePath, session);
      delete activeSessions[filePath];
    }
  });
}, 30000);

// Detect file changes
watcher.on('change', (filePath) => {
  console.log(`File changed: ${filePath}`);  // ADD THIS
  // Filter by file type
  if (!isTrackedFileType(filePath)) {
    console.log(`Skipped - not a tracked extension`);  // ADD THIS
    return;
  }

  const now = new Date();

  if (!activeSessions[filePath]) {
    activeSessions[filePath] = {
      startTime: now,
      lastActivity: now
    };

    console.log(`Started session: ${filePath}`);
  } else {
    activeSessions[filePath].lastActivity = now;
  }
});

// Filter to only track certain file types
function isTrackedFileType(filePath) {
  const trackedExtensions = ['.docx', '.txt', '.doc', '.pdf', '.xlsx', '.pptx'];
  return trackedExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
}

// Clean file name for metadata
function cleanFileName(filePath) {
  return filePath.split('/').pop().replace(/\.(docx|txt|doc|pdf|xlsx|pptx)$/i, '');
}

// Create and save activity event
async function createDocumentEvent(filePath, session) {
  // Filter: ignore sessions shorter than 5 seconds for testing
  const duration = session.lastActivity - session.startTime;
  if (duration < 5 * 1000) {
    console.log(`Ignored short session: ${filePath} (${duration}ms)`);
    return;
  }

  const event = {
    type: "document",
    startTime: session.startTime,
    endTime: session.lastActivity,
    source: "local",
    metadata: {
      fileName: cleanFileName(filePath),
      filePath: filePath,
      durationMs: duration
    }
  };

  console.log("DOCUMENT EVENT:", event);

  // Save to database
  try {
    const activityId = await createActivity(event);
    console.log(`Activity saved with ID: ${activityId}`);
  } catch (error) {
    console.error("Failed to save activity:", error);
  }
}

module.exports = watcher;
