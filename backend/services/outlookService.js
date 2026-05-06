const axios = require('axios');
const { getAccessToken, isAuthenticated } = require('./microsoftAuthService');
const { createActivity } = require('./activityService');

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Fetch emails from Outlook
 * @returns {Promise<Array>} Array of email objects
 */
async function fetchOutlookEmails() {
  try {
    if (!isAuthenticated()) {
      console.log('⚠ User not authenticated. Skipping email fetch.');
      return [];
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log('⚠ No valid access token. Skipping email fetch.');
      return [];
    }

    const response = await axios.get(`${GRAPH_API_BASE}/me/messages`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        $select: 'subject,from,receivedDateTime,bodyPreview',
        $top: 50,
        $orderby: 'receivedDateTime DESC'
      }
    });

    const emails = response.data.value.map(email => ({
      id: email.id,
      subject: email.subject,
      sender: email.from?.emailAddress?.name || 'Unknown',
      senderEmail: email.from?.emailAddress?.address || '',
      receivedDateTime: email.receivedDateTime,
      preview: email.bodyPreview || '',
      type: 'email'
    }));

    console.log(`✓ Fetched ${emails.length} emails from Outlook`);
    return emails;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('⚠ Authentication failed. Token may be expired.');
    } else {
      console.error('Error fetching emails:', error.message);
    }
    return [];
  }
}

/**
 * Fetch calendar events from Outlook
 * @returns {Promise<Array>} Array of event objects
 */
async function fetchOutlookEvents() {
  try {
    if (!isAuthenticated()) {
      console.log('⚠ User not authenticated. Skipping calendar fetch.');
      return [];
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log('⚠ No valid access token. Skipping calendar fetch.');
      return [];
    }

    const response = await axios.get(`${GRAPH_API_BASE}/me/events`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        $select: 'subject,start,end,attendees,isReminderOn,isOrganizer',
        $top: 50,
        $orderby: 'start/dateTime DESC',
        $filter: "start/dateTime ge '" + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() + "'"
      }
    });

    const events = response.data.value.map(event => ({
      id: event.id,
      subject: event.subject,
      start: event.start?.dateTime,
      end: event.end?.dateTime,
      attendeeCount: event.attendees?.length || 0,
      isOrganizer: event.isOrganizer || false,
      type: 'meeting'
    }));

    console.log(`✓ Fetched ${events.length} calendar events from Outlook`);
    return events;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('⚠ Authentication failed. Token may be expired.');
    } else {
      console.error('Error fetching calendar events:', error.message);
    }
    return [];
  }
}

/**
 * Convert Outlook email to ActivityEvent format
 */
function emailToActivity(email) {
  // Treat email as instantaneous activity at received time
  const receivedTime = new Date(email.receivedDateTime);
  const endTime = new Date(receivedTime.getTime() + 60000); // Add 1 minute

  return {
    type: 'email',
    startTime: receivedTime,
    endTime: endTime,
    source: 'outlook',
    metadata: {
      subject: email.subject,
      sender: email.sender,
      senderEmail: email.senderEmail,
      preview: email.preview
    }
  };
}

/**
 * Convert Outlook calendar event to ActivityEvent format
 */
function eventToActivity(event) {
  return {
    type: 'meeting',
    startTime: new Date(event.start),
    endTime: new Date(event.end),
    source: 'outlook',
    metadata: {
      subject: event.subject,
      attendeeCount: event.attendeeCount,
      isOrganizer: event.isOrganizer
    }
  };
}

/**
 * Poll Outlook for new data and create activities
 */
async function pollOutlookData() {
  try {
    if (!isAuthenticated()) {
      console.log('⚠ Not authenticated. Skipping Outlook polling.');
      return;
    }

    console.log('📧 Polling Outlook data...');

    // Fetch emails and events
    const emails = await fetchOutlookEmails();
    const events = await fetchOutlookEvents();

    let emailsCreated = 0;
    let eventsCreated = 0;

    // Convert emails to activities and save
    for (const email of emails) {
      try {
        const activity = emailToActivity(email);
        await createActivity(activity);
        emailsCreated++;
      } catch (error) {
        console.error(`Failed to create activity for email "${email.subject}":`, error.message);
      }
    }

    // Convert events to activities and save
    for (const event of events) {
      try {
        const activity = eventToActivity(event);
        await createActivity(activity);
        eventsCreated++;
      } catch (error) {
        console.error(`Failed to create activity for event "${event.subject}":`, error.message);
      }
    }

    console.log(`✓ Outlook polling complete: ${emailsCreated} emails, ${eventsCreated} events processed`);
  } catch (error) {
    console.error('Error during Outlook polling:', error.message);
  }
}

/**
 * Start polling Outlook data at specified intervals
 * @param {number} intervalMs - Polling interval in milliseconds (default: 60000 = 1 minute)
 */
function startOutlookPolling(intervalMs = 60000) {
  console.log(`🔄 Starting Outlook polling every ${intervalMs / 1000} seconds...`);

  // Initial poll
  pollOutlookData().catch(error => {
    console.error('Initial Outlook poll failed:', error.message);
  });

  // Set up recurring poll
  const pollInterval = setInterval(() => {
    pollOutlookData().catch(error => {
      console.error('Scheduled Outlook poll failed:', error.message);
    });
  }, intervalMs);

  return pollInterval;
}

module.exports = {
  fetchOutlookEmails,
  fetchOutlookEvents,
  emailToActivity,
  eventToActivity,
  pollOutlookData,
  startOutlookPolling
};
