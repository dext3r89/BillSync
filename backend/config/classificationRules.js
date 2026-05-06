/**
 * Classification Rules Configuration
 * 
 * Defines keyword mappings for automatic activity classification.
 * Easily extendable for new clients, task types, and rules.
 */

const classificationRules = {
  // Client keyword mappings
  clients: {
    eskom: {
      keywords: ['eskom', 'eskom limited', 'power utility'],
      aliases: ['ESKOM']
    },
    deloitte: {
      keywords: ['deloitte', 'deloitte sa', 'consulting'],
      aliases: ['DELOITTE']
    },
    standard_bank: {
      keywords: ['standard bank', 'banking', 'sbsa'],
      aliases: ['STANBIC']
    },
    sasol: {
      keywords: ['sasol', 'fuel', 'energy'],
      aliases: ['SASOL LTD']
    }
  },

  // Task type keyword mappings
  taskTypes: {
    email_review: {
      keywords: ['re:', 'fwd:', 'email', 'outlook', 'gmail', 'message'],
      patterns: [/^re:/i, /^fwd:/i]
    },
    document_review: {
      keywords: ['document', 'pdf', 'docx', 'contract', 'agreement', 'review', 'word'],
      patterns: [/\.pdf$/i, /\.docx?$/i, /contract|agreement/i]
    },
    meeting: {
      keywords: ['meeting', 'call', 'conference', 'teams', 'zoom', 'interview'],
      patterns: [/meeting|conference|call/i]
    },
    research: {
      keywords: ['research', 'legal research', 'case law', 'precedent', 'legislation'],
      patterns: [/research|case law/i]
    },
    drafting: {
      keywords: ['draft', 'writing', 'compose', 'prepare', 'memo', 'brief'],
      patterns: [/draft|prepare|compose/i]
    },
    administration: {
      keywords: ['admin', 'file', 'organize', 'schedule', 'coordinate', 'correspondence'],
      patterns: [/admin|schedule|file/i]
    },
    billing: {
      keywords: ['billing', 'invoice', 'time', 'docket', 'charge'],
      patterns: [/billing|invoice|docket/i]
    }
  },

  // Billability rules
  // Task types that are typically billable
  billableTaskTypes: new Set([
    'email_review',
    'document_review',
    'meeting',
    'research',
    'drafting'
  ]),

  // Sources that are typically billable
  billableSources: new Set([
    'outlook',
    'gmail',
    'document',
    'manual_entry'
  ]),

  // Confidence thresholds
  confidenceThresholds: {
    high: 0.8,    // Multiple matches or strong pattern match
    medium: 0.5,  // Single match or weak pattern match
    low: 0.2      // Very few or ambiguous matches
  }
};

/**
 * Add a new client to the classification rules
 * @param {string} clientKey - Unique identifier for the client
 * @param {string[]} keywords - Array of keywords to match
 * @param {string[]} aliases - Optional client name aliases
 */
function addClient(clientKey, keywords, aliases = []) {
  classificationRules.clients[clientKey] = {
    keywords,
    aliases
  };
}

/**
 * Add a new task type to the classification rules
 * @param {string} taskKey - Unique identifier for the task type
 * @param {string[]} keywords - Array of keywords to match
 * @param {RegExp[]} patterns - Optional regex patterns for matching
 * @param {boolean} billable - Whether this task type is billable
 */
function addTaskType(taskKey, keywords, patterns = [], billable = true) {
  classificationRules.taskTypes[taskKey] = {
    keywords,
    patterns
  };
  if (billable) {
    classificationRules.billableTaskTypes.add(taskKey);
  }
}

module.exports = {
  classificationRules,
  addClient,
  addTaskType
};
