/**
 * Matter Matching Service
 * 
 * Matches activities to legal matters based on content analysis
 * and matter keyword definitions.
 */

const { getDB } = require('../db/dbInstance');

/**
 * Get all matters from the database
 * @returns {Promise<object[]>} Array of matter objects
 */
async function getAllMatters() {
  try {
    const db = getDB();
    const matters = await db.all(`
      SELECT id, client_name, matter_code, description, keywords
      FROM matters
      ORDER BY client_name, matter_code
    `);
    return matters || [];
  } catch (error) {
    console.error('Error fetching matters from database:', error);
    return [];
  }
}

/**
 * Build searchable text from activity (same logic as classification service)
 * @param {object} activity - The activity object
 * @returns {string} Concatenated searchable text
 */
function buildActivitySearchText(activity) {
  let searchText = '';

  if (activity.type) {
    searchText += activity.type.toLowerCase() + ' ';
  }

  if (activity.source) {
    searchText += activity.source.toLowerCase() + ' ';
  }

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
    const fieldsToSearch = ['subject', 'title', 'filename', 'name', 'description', 'content', 'body', 'keywords', 'client'];
    for (const field of fieldsToSearch) {
      if (metadata[field]) {
        searchText += String(metadata[field]).toLowerCase() + ' ';
      }
    }
  }

  // Add classified client and task type if available
  if (activity.client) {
    searchText += activity.client.toLowerCase() + ' ';
  }

  return searchText;
}

/**
 * Parse keywords from a comma-separated string
 * @param {string} keywordString - Comma-separated keywords
 * @returns {string[]} Array of trimmed keywords
 */
function parseKeywords(keywordString) {
  if (!keywordString) {
    return [];
  }
  return keywordString
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);
}

/**
 * Calculate keyword match score between activity and matter
 * @param {string} searchText - Activity search text
 * @param {string[]} matterKeywords - Matter keywords
 * @returns {object} Match score and matched keywords
 */
function calculateMatchScore(searchText, matterKeywords) {
  let matches = 0;
  const matchedKeywords = [];

  for (const keyword of matterKeywords) {
    if (searchText.includes(keyword)) {
      matches++;
      matchedKeywords.push(keyword);
    }
  }

  // Weight the score: more matches = higher score
  // Normalized to 0-1 range
  const score = matterKeywords.length > 0 ? matches / matterKeywords.length : 0;

  return {
    score,
    matches,
    totalKeywords: matterKeywords.length,
    matchedKeywords
  };
}

/**
 * Match an activity to a specific matter
 * @param {object} activity - The activity to match
 * @param {object} matter - The matter to match against
 * @returns {object} Match result with score and details
 */
function matchActivityToMatter(activity, matter) {
  const searchText = buildActivitySearchText(activity);
  const matterKeywords = parseKeywords(matter.keywords);

  if (matterKeywords.length === 0) {
    return {
      matterCode: matter.matter_code,
      mattersId: matter.id,
      score: 0,
      matched: false,
      reason: 'No keywords defined for matter'
    };
  }

  const matchResult = calculateMatchScore(searchText, matterKeywords);

  return {
    matterCode: matter.matter_code,
    matterId: matter.id,
    clientName: matter.client_name,
    score: matchResult.score,
    matches: matchResult.matches,
    totalKeywords: matchResult.totalKeywords,
    matchedKeywords: matchResult.matchedKeywords,
    matched: matchResult.matches > 0,
    confidence: matchResult.score >= 0.5 ? 'high' : matchResult.score >= 0.3 ? 'medium' : 'low'
  };
}

/**
 * Match an activity against all available matters
 * Returns the best matching matter code
 * 
 * @param {object} activity - The activity to match
 * @param {object[]} matters - Array of matter objects (optional, fetches from DB if not provided)
 * @returns {Promise<object>} Best match result
 * @returns {string} result.matterCode - The matched matter code (or null)
 * @returns {string} result.matterId - The matched matter ID (or null)
 * @returns {number} result.score - Match confidence score (0-1)
 * @returns {object[]} result.allMatches - All matches sorted by score
 */
async function matchMatter(activity, matters = null) {
  if (!activity) {
    throw new Error('Activity cannot be null or undefined');
  }

  try {
    // Fetch matters if not provided
    if (!matters || !Array.isArray(matters)) {
      matters = await getAllMatters();
    }

    if (matters.length === 0) {
      return {
        matterCode: null,
        matterId: null,
        score: 0,
        reason: 'No matters configured in database',
        allMatches: []
      };
    }

    // Match activity against all matters
    const allMatches = matters
      .map(matter => matchActivityToMatter(activity, matter))
      .filter(match => match.matched)
      .sort((a, b) => b.score - a.score);

    if (allMatches.length === 0) {
      return {
        matterCode: null,
        matterId: null,
        score: 0,
        reason: 'No matching matters found',
        allMatches
      };
    }

    // Return best match
    const bestMatch = allMatches[0];
    return {
      matterCode: bestMatch.matterCode,
      matterId: bestMatch.matterId,
      clientName: bestMatch.clientName,
      score: Math.round(bestMatch.score * 100) / 100,
      matchedKeywords: bestMatch.matchedKeywords,
      allMatches: allMatches.slice(0, 5) // Return top 5 matches
    };
  } catch (error) {
    console.error('Error matching matter:', error);
    return {
      matterCode: null,
      matterId: null,
      score: 0,
      error: error.message,
      allMatches: []
    };
  }
}

/**
 * Create a new matter in the database
 * @param {string} clientName - Name of the client
 * @param {string} matterCode - Unique matter code (e.g., "ESKOM-2024-001")
 * @param {string} description - Matter description
 * @param {string} keywords - Comma-separated keywords for matching
 * @returns {Promise<number>} ID of created matter
 */
async function createMatter(clientName, matterCode, description, keywords = '') {
  try {
    const db = getDB();
    const result = await db.run(
      `INSERT INTO matters (client_name, matter_code, description, keywords)
       VALUES (?, ?, ?, ?)`,
      [clientName, matterCode, description, keywords]
    );
    return result.lastID;
  } catch (error) {
    console.error('Error creating matter:', error);
    throw error;
  }
}

/**
 * Update matter keywords
 * @param {number} matterId - Matter ID
 * @param {string} keywords - Comma-separated keywords
 * @returns {Promise<boolean>} Success status
 */
async function updateMatterKeywords(matterId, keywords) {
  try {
    const db = getDB();
    await db.run(
      `UPDATE matters SET keywords = ? WHERE id = ?`,
      [keywords, matterId]
    );
    return true;
  } catch (error) {
    console.error('Error updating matter keywords:', error);
    throw error;
  }
}

module.exports = {
  matchMatter,
  getAllMatters,
  createMatter,
  updateMatterKeywords,
  parseKeywords,
  matchActivityToMatter
};
