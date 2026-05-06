/**
 * AI Enhancement Service
 * 
 * Provides AI-powered enhancement capabilities for activity enrichment.
 * Currently structured as a stub - ready for OpenAI integration.
 * 
 * This service can be extended to:
 * - Improve narration with semantic understanding
 * - Extract entities from activity content
 * - Suggest confidence improvements
 * - Identify missing or misclassified activities
 */

/**
 * Stub function for OpenAI-powered activity enhancement
 * 
 * This function is structured to accept an activity and use OpenAI's
 * API to improve classification confidence, generate better narrations,
 * or extract additional business context.
 * 
 * @param {object} activity - The activity to enhance
 * @param {string} activity.client - Classified client (from classificationService)
 * @param {string} activity.taskType - Classified task type
 * @param {string} activity.narration - Generated narration
 * @param {number} activity.confidence - Current confidence score
 * @param {object} activity.metadata - Original metadata
 * @returns {Promise<object>} Enhanced activity data
 * 
 * FUTURE IMPLEMENTATION:
 * - Validate the OpenAI API key is available
 * - Send activity content to OpenAI with a prompt asking to:
 *   a) Confirm or improve client classification
 *   b) Confirm or improve task type classification
 *   c) Generate a better narration if confidence is low
 *   d) Extract key entities (people, contracts, legislation)
 * - Parse the response and merge with existing classification
 * - Handle errors and fallback to non-AI classification
 * 
 * Cost optimization:
 * - Only call when confidence < 0.6
 * - Batch multiple low-confidence activities
 * - Cache results for similar activities
 */
async function enhanceWithAI(activity) {
  // Placeholder implementation
  // When OpenAI API key is available, this will enhance the activity

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    // AI enhancement not configured, return activity unchanged
    return {
      enhanced: false,
      reason: 'OpenAI API key not configured',
      originalActivity: activity
    };
  }

  try {
    // FUTURE: Call OpenAI API
    // const prompt = buildEnhancementPrompt(activity);
    // const response = await openai.createChatCompletion({
    //   model: 'gpt-4',
    //   messages: [{ role: 'user', content: prompt }],
    //   temperature: 0.3,
    //   max_tokens: 500
    // });

    // FUTURE: Parse response and extract improvements
    // const aiSuggestions = parseAIResponse(response.data.choices[0].message.content);

    // FUTURE: Return enhanced activity
    // return {
    //   enhanced: true,
    //   originalActivity: activity,
    //   aiEnhancements: aiSuggestions,
    //   mergedActivity: mergeEnhancements(activity, aiSuggestions)
    // };

    // Stub response for now
    return {
      enhanced: false,
      reason: 'AI enhancement stub - awaiting OpenAI integration',
      originalActivity: activity
    };
  } catch (error) {
    console.error('Error in AI enhancement:', error);
    return {
      enhanced: false,
      error: error.message,
      originalActivity: activity
    };
  }
}

/**
 * Build a prompt for OpenAI to enhance activity classification
 * FUTURE: This will be used when OpenAI integration is implemented
 * 
 * @param {object} activity - The activity to enhance
 * @returns {string} Prompt for OpenAI
 */
function buildEnhancementPrompt(activity) {
  // FUTURE IMPLEMENTATION
  const metadata = typeof activity.metadata === 'string'
    ? JSON.parse(activity.metadata)
    : activity.metadata;

  return `
Analyze this legal activity and improve its classification:

Activity Type: ${activity.type}
Source: ${activity.source}
Current Client Classification: ${activity.client || 'Unclassified'}
Current Task Type: ${activity.taskType || 'Unclassified'}
Current Confidence: ${activity.confidence}

Activity Content:
${JSON.stringify(metadata, null, 2)}

Please provide:
1. Confirmed or corrected client name
2. Confirmed or corrected task type
3. Improved billing narration
4. Key entities (people, legislation, contracts)
5. Confidence assessment (0-1)

Format as JSON.`;
}

/**
 * Check if activity should be enhanced with AI
 * Enhancement is recommended for low-confidence classifications
 * 
 * @param {object} activity - The activity to evaluate
 * @returns {boolean} True if AI enhancement is recommended
 */
function shouldEnhanceWithAI(activity) {
  // Enhance if confidence is below threshold
  const confidenceThreshold = 0.6;

  if (!activity || !activity.confidence) {
    return false;
  }

  return activity.confidence < confidenceThreshold;
}

/**
 * Batch enhancement for multiple activities
 * Useful for processing low-confidence activities in bulk
 * 
 * @param {object[]} activities - Array of activities to enhance
 * @returns {Promise<object>} Results of batch enhancement
 */
async function batchEnhanceActivities(activities) {
  if (!Array.isArray(activities)) {
    throw new Error('Input must be an array of activities');
  }

  // Filter to only low-confidence activities
  const candidatesForEnhancement = activities.filter(shouldEnhanceWithAI);

  if (candidatesForEnhancement.length === 0) {
    return {
      processed: 0,
      enhanced: 0,
      skipped: activities.length,
      results: []
    };
  }

  // FUTURE: Group similar activities and batch process with OpenAI
  // For now, return mock results
  const results = await Promise.all(
    candidatesForEnhancement.map(activity => enhanceWithAI(activity))
  );

  return {
    processed: candidatesForEnhancement.length,
    enhanced: results.filter(r => r.enhanced).length,
    skipped: activities.length - candidatesForEnhancement.length,
    results
  };
}

module.exports = {
  enhanceWithAI,
  shouldEnhanceWithAI,
  buildEnhancementPrompt,
  batchEnhanceActivities
};
