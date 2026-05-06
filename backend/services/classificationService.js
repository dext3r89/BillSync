/**
 * Activity Classification Service
 * 
 * Classifies activities with client, task type, and billability
 * using keyword matching and pattern recognition.
 * 
 * Returns structured classification with confidence scores.
 */

const { classificationRules } = require('../config/classificationRules');

/**
 * Convert activity metadata to searchable text
 * @param {object} activity - The activity object
 * @returns {string} Concatenated searchable text
 */
function buildSearchableText(activity) {
  let searchText = '';

  // Add activity type
  if (activity.type) {
    searchText += activity.type.toLowerCase() + ' ';
  }

  // Add source
  if (activity.source) {
    searchText += activity.source.toLowerCase() + ' ';
  }

  // Parse and add metadata
  let metadata = activity.metadata;
  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      searchText += metadata.toLowerCase() + ' ';
      return searchText;
    }
  }

  if (typeof metadata === 'object' && metadata !== null) {
    const fieldsToSearch = ['subject', 'title', 'filename', 'name', 'description', 'content', 'body', 'topic'];
    for (const field of fieldsToSearch) {
      if (metadata[field]) {
        searchText += String(metadata[field]).toLowerCase() + ' ';
      }
    }
  }

  return searchText;
}

/**
 * Match keywords against searchable text
 * @param {string} searchText - The text to search
 * @param {string[]} keywords - Keywords to match
 * @param {RegExp[]} patterns - Regex patterns to match
 * @returns {object} Match result with count and strength
 */
function matchKeywords(searchText, keywords = [], patterns = []) {
  let matches = 0;
  let patternMatches = 0;

  // Check keyword matches
  if (Array.isArray(keywords)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
  }

  // Check pattern matches (stronger signal)
  if (Array.isArray(patterns)) {
    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        patternMatches++;
      }
    }
  }

  return {
    keywordMatches: matches,
    patternMatches: patternMatches,
    totalMatches: matches + patternMatches * 2 // Patterns weighted heavier
  };
}

/**
 * Classify a client based on activity content
 * @param {string} searchText - Searchable text from activity
 * @returns {object} Classification result with client name and confidence
 */
function classifyClient(searchText) {
  let bestMatch = null;
  let highestScore = 0;
  const matches = [];

  for (const [clientKey, clientConfig] of Object.entries(classificationRules.clients)) {
    const result = matchKeywords(
      searchText,
      clientConfig.keywords,
      [] // Clients typically don't have patterns
    );

    if (result.totalMatches > 0) {
      matches.push({
        client: clientKey,
        score: result.totalMatches,
        matchCount: result.keywordMatches
      });

      if (result.totalMatches > highestScore) {
        highestScore = result.totalMatches;
        bestMatch = clientKey;
      }
    }
  }

  return {
    client: bestMatch,
    confidence: highestScore > 0 ? Math.min(0.95, highestScore * 0.3) : 0,
    matchCount: highestScore,
    allMatches: matches.sort((a, b) => b.score - a.score)
  };
}

/**
 * Classify task type based on activity content
 * @param {string} searchText - Searchable text from activity
 * @returns {object} Classification result with task type and confidence
 */
function classifyTaskType(searchText) {
  let bestMatch = null;
  let highestScore = 0;
  let patternMatched = false;
  const matches = [];

  for (const [taskKey, taskConfig] of Object.entries(classificationRules.taskTypes)) {
    const result = matchKeywords(
      searchText,
      taskConfig.keywords,
      taskConfig.patterns
    );

    if (result.totalMatches > 0) {
      const hasPatternMatch = result.patternMatches > 0;
      matches.push({
        taskType: taskKey,
        score: result.totalMatches,
        keywordMatches: result.keywordMatches,
        patternMatches: result.patternMatches
      });

      if (result.totalMatches > highestScore) {
        highestScore = result.totalMatches;
        bestMatch = taskKey;
        patternMatched = hasPatternMatch;
      }
    }
  }

  // Calculate confidence based on match strength
  let confidence = 0;
  if (highestScore > 0) {
    if (patternMatched) {
      confidence = 0.9; // Strong signal from regex pattern
    } else if (highestScore >= 2) {
      confidence = 0.8; // Multiple keyword matches
    } else {
      confidence = 0.5; // Single keyword match
    }
  }

  return {
    taskType: bestMatch,
    confidence,
    matchCount: highestScore,
    allMatches: matches.sort((a, b) => b.score - a.score)
  };
}

/**
 * Main classification function
 * Classifies an activity and returns structured classification data
 * 
 * @param {object} activity - The activity to classify
 * @param {string} activity.type - Activity type (email, document, meeting, etc.)
 * @param {string} activity.source - Source of activity (outlook, gmail, file, etc.)
 * @param {object|string} activity.metadata - Activity metadata (subject, filename, etc.)
 * @returns {Promise<object>} Classification result
 * @returns {string} result.client - Classified client name
 * @returns {string} result.taskType - Classified task type
 * @returns {boolean} result.billable - Whether activity is billable
 * @returns {number} result.confidence - Overall confidence score (0-1)
 * @returns {object} result.details - Detailed classification breakdown
 */
async function classifyActivity(activity) {
  if (!activity) {
    throw new Error('Activity cannot be null or undefined');
  }

  try {
    // Build searchable text from activity
    const searchText = buildSearchableText(activity);

    if (!searchText || searchText.trim().length === 0) {
      console.warn('Warning: Empty searchable text for activity', activity.id);
      return {
        client: null,
        taskType: null,
        billable: false,
        confidence: 0,
        details: {
          reason: 'Insufficient activity content for classification'
        }
      };
    }

    // Classify client and task type
    const clientClassification = classifyClient(searchText);
    const taskClassification = classifyTaskType(searchText);

    // Determine billability
    let billable = false;
    if (taskClassification.taskType) {
      billable = classificationRules.billableTaskTypes.has(taskClassification.taskType);
    }
    if (activity.source) {
      billable = billable && classificationRules.billableSources.has(activity.source.toLowerCase());
    }

    // Calculate overall confidence
    // High confidence: both client and task type classified with high scores
    // Medium confidence: either client or task type classified well
    // Low confidence: weak or no classification
    let overallConfidence = 0;
    if (clientClassification.confidence > 0.5 && taskClassification.confidence > 0.5) {
      overallConfidence = Math.min(0.95, (clientClassification.confidence + taskClassification.confidence) / 2);
    } else if (taskClassification.confidence > 0.5) {
      overallConfidence = taskClassification.confidence * 0.9; // Reduce if no client match
    } else if (clientClassification.confidence > 0.5) {
      overallConfidence = clientClassification.confidence * 0.7; // Reduce if no task type match
    }

    const classification = {
      client: clientClassification.client,
      taskType: taskClassification.taskType,
      billable,
      confidence: Math.round(overallConfidence * 100) / 100, // Round to 2 decimals
      details: {
        clientMatches: clientClassification.allMatches,
        taskTypeMatches: taskClassification.allMatches,
        searchTextLength: searchText.length,
        source: activity.source,
        activityType: activity.type
      }
    };

    return classification;
  } catch (error) {
    console.error('Error classifying activity:', error);
    return {
      client: null,
      taskType: null,
      billable: false,
      confidence: 0,
      details: {
        error: error.message
      }
    };
  }
}

module.exports = {
  classifyActivity,
  classifyClient,
  classifyTaskType,
  buildSearchableText
};
