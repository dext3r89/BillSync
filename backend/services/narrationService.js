/**
 * Narration Generation Service
 * 
 * Creates human-readable billing descriptions for activities
 * based on task type, client, and activity metadata.
 */

const { classificationRules } = require('../config/classificationRules');

/**
 * Generate a billing narration for an activity
 * @param {object} activity - The enriched activity object
 * @param {string} activity.taskType - The classified task type
 * @param {string} activity.client - The classified client
 * @param {object} activity.metadata - Original activity metadata
 * @param {string} activity.type - Activity type (e.g., 'email', 'document', 'meeting')
 * @returns {string} A concise billing narration
 */
function generateNarration(activity) {
  if (!activity) {
    return 'Activity processing';
  }

  const { taskType, client, metadata = {}, type, source } = activity;
  let narration = '';

  // Parse metadata if it's a string
  let metadataObj = metadata;
  if (typeof metadata === 'string') {
    try {
      metadataObj = JSON.parse(metadata);
    } catch (e) {
      metadataObj = {};
    }
  }

  // Task type narration templates
  const taskNarrations = {
    email_review: () => {
      const subject = metadataObj.subject || metadataObj.title || 'email';
      const action = subject.toLowerCase().includes('urgent') ? 'Reviewed and responded to urgent' : 'Reviewed and responded to';
      return `${action} email regarding ${subject}`;
    },
    document_review: () => {
      const filename = metadataObj.filename || metadataObj.name || 'document';
      const cleanName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
      return `Review of ${cleanName} document`;
    },
    meeting: () => {
      const title = metadataObj.subject || metadataObj.title || 'meeting';
      const attendees = metadataObj.attendees ? ` with ${Array.isArray(metadataObj.attendees) ? metadataObj.attendees.length : 1} participants` : '';
      return `Attended ${title}${attendees}`;
    },
    research: () => {
      const topic = metadataObj.topic || metadataObj.subject || 'legal research';
      return `Conducted research on ${topic}`;
    },
    drafting: () => {
      const docType = metadataObj.documentType || metadataObj.type || 'document';
      return `Drafted ${docType}`;
    },
    administration: () => {
      const action = metadataObj.action || 'administrative task';
      return `Completed ${action}`;
    },
    billing: () => {
      return 'Billing and docketing';
    }
  };

  // Generate task-based narration
  if (taskType && taskNarrations[taskType]) {
    narration = taskNarrations[taskType]();
  } else {
    // Fallback narration
    const sourceType = source || type || 'activity';
    narration = `${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)} review and processing`;
  }

  // Add client context if available
  if (client) {
    narration = `${narration} (${client})`;
  }

  // Ensure narration is concise (under 150 characters for billing)
  if (narration.length > 150) {
    narration = narration.substring(0, 147) + '...';
  }

  return narration;
}

/**
 * Generate an extended narration with additional context
 * Useful for detailed time entry descriptions
 * @param {object} activity - The enriched activity object
 * @returns {string} An extended billing narration (up to 500 chars)
 */
function generateExtendedNarration(activity) {
  if (!activity) {
    return 'Activity processing';
  }

  const baseNarration = generateNarration(activity);
  const { metadata = {}, matter } = activity;

  let metadataObj = metadata;
  if (typeof metadata === 'string') {
    try {
      metadataObj = JSON.parse(metadata);
    } catch (e) {
      metadataObj = {};
    }
  }

  let extended = baseNarration;

  // Add matter reference if available
  if (matter) {
    extended += ` [Matter: ${matter}]`;
  }

  // Add relevant metadata details
  const relevantKeys = ['description', 'summary', 'keywords', 'tags'];
  for (const key of relevantKeys) {
    if (metadataObj[key]) {
      const detail = metadataObj[key];
      if (typeof detail === 'string' && detail.length > 0 && detail.length < 100) {
        extended += ` - ${detail}`;
        break;
      }
    }
  }

  // Ensure it stays under 500 characters
  if (extended.length > 500) {
    extended = extended.substring(0, 497) + '...';
  }

  return extended;
}

module.exports = {
  generateNarration,
  generateExtendedNarration
};
