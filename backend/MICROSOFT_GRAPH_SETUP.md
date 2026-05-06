# Microsoft Graph OAuth 2.0 Integration Setup

## Overview

This backend now integrates with Microsoft Graph API to fetch Outlook email and calendar data. Uses OAuth 2.0 Authorization Code Flow with Azure Entra ID (formerly Azure AD).

## Prerequisites

- Node.js 16+
- Azure subscription (free tier works)
- Microsoft account or work account

## Step 1: Register Application in Azure

### 1.1 Go to Azure Portal

1. Visit [Azure Portal](https://portal.azure.com)
2. Search for **App registrations**
3. Click **New registration**

### 1.2 Register Your App

Fill in the form:

- **Name**: `BillSync` (or your preferred name)
- **Supported account types**: `Accounts in any organizational directory (Any Azure AD directory - Multitenant)`
- **Redirect URI**: `Web` → `http://localhost:3001/auth/microsoft/callback`
- Click **Register**

### 1.3 Copy Credentials

On the app overview page, copy:

- **Application (client) ID** → Set as `MS_CLIENT_ID`
- **Directory (tenant) ID** → Keep for reference (use "common" for multi-tenant)

### 1.4 Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set expiration: **24 months** (or your preference)
4. Click **Add**
5. **Copy the secret value immediately** → Set as `MS_CLIENT_SECRET`
   - (You won't be able to see it again!)

### 1.5 Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Search and add:
   - `User.Read` (read user profile)
   - `Mail.Read` (read emails)
   - `Calendars.Read` (read calendar events)
6. Click **Grant admin consent** (if you're admin)

## Step 2: Configure Backend

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Create `.env` File

Copy the `.env.example` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
MS_CLIENT_ID=your-client-id-from-azure
MS_CLIENT_SECRET=your-client-secret-from-azure
MS_TENANT_ID=common
REDIRECT_URI=http://localhost:3001/auth/microsoft/callback
```

### 2.3 Verify Setup

```bash
npm start
```

You should see:

```
✓ MSAL initialized successfully
✓ Database initialized
✓ File watcher started - monitoring ./tracked_files
🚀 Server running on http://localhost:3001
```

## Step 3: Authentication Flow

### 3.1 Start Login

Visit: `http://localhost:3001/auth/microsoft`

### 3.2 Approve Permissions

- Microsoft will ask you to approve the requested permissions
- Click **Accept**

### 3.3 Callback

Your browser will redirect to:
```
http://localhost:3001/auth/microsoft/callback?code=...
```

You'll see a success response:
```json
{
  "success": true,
  "message": "Authentication successful"
}
```

## Step 4: Sync Outlook Data

Once authenticated, the system will:

1. **Automatically poll** every 60 seconds (configurable)
2. Fetch emails from Outlook
3. Fetch calendar events
4. Convert to ActivityEvent format
5. Store in SQLite

### 4.1 Manual Sync

```bash
curl -X POST http://localhost:3001/sync/outlook
```

Response:
```json
{
  "success": true,
  "message": "Outlook sync completed"
}
```

## Step 5: Check Data

### View Activities

```bash
curl http://localhost:3001/activities
```

### Check Auth Status

```bash
curl http://localhost:3001/auth/status
```

### Logout

```bash
curl -X POST http://localhost:3001/auth/logout
```

## File Structure

```
backend/
├── services/
│   ├── microsoftAuthService.js    # OAuth 2.0 authentication
│   ├── outlookService.js          # Email & calendar fetching
│   └── activityService.js         # Activity database operations
├── routes/
│   ├── authRoutes.js              # Auth endpoints
│   ├── activityRoutes.js          # Activity endpoints
│   └── server.js                  # Main server
├── db/
│   ├── schema.sql                 # Database schema
│   └── database.sqlite            # SQLite database (auto-created)
├── .env.example
├── package.json
└── package-lock.json
```

## How It Works

### Authentication

1. User visits `/auth/microsoft`
2. Backend generates Microsoft login URL
3. User logs in and approves permissions
4. Microsoft redirects to `/auth/microsoft/callback?code=...`
5. Backend exchanges code for access token
6. Token stored in memory (for demo; use Redis/DB in production)

### Data Fetching

1. Backend periodically calls Microsoft Graph API
2. Fetches emails: `GET /me/messages`
3. Fetches events: `GET /me/events`
4. Converts to ActivityEvent format
5. Stores in SQLite

### Activity Format

**Email Activity:**
```json
{
  "type": "email",
  "startTime": "2026-05-02T09:00:00Z",
  "endTime": "2026-05-02T09:01:00Z",
  "source": "outlook",
  "metadata": {
    "subject": "Meeting tomorrow?",
    "sender": "john@example.com",
    "preview": "Hi, are you available..."
  }
}
```

**Meeting Activity:**
```json
{
  "type": "meeting",
  "startTime": "2026-05-02T14:00:00Z",
  "endTime": "2026-05-02T15:00:00Z",
  "source": "outlook",
  "metadata": {
    "subject": "Q2 Planning",
    "attendeeCount": 5,
    "isOrganizer": true
  }
}
```

## Troubleshooting

### "MSAL not initialized"

Check environment variables:
```bash
echo $env:MS_CLIENT_ID
echo $env:MS_CLIENT_SECRET
```

Verify in `.env`:
```
MS_CLIENT_ID=your-actual-client-id
MS_CLIENT_SECRET=your-actual-secret
```

### "No access token found"

User must authenticate first:
```bash
curl http://localhost:3001/auth/microsoft
```

### "Token expired"

Token refresh is not yet implemented. User must re-authenticate.

In production:
- Store tokens in Redis/database
- Implement token refresh
- Use secure HTTP-only cookies

### Graph API 401 Errors

- Check if permissions are granted in Azure
- Verify token hasn't expired
- Re-authenticate: `/auth/microsoft`

## Production Considerations

### Security

1. **Store tokens securely**
   - Use Redis or encrypted database
   - Never log tokens
   - Use HTTP-only cookies

2. **Token refresh**
   - Implement `acquireTokenSilent` with refresh tokens
   - Handle token rotation

3. **HTTPS**
   - Always use HTTPS in production
   - Update REDIRECT_URI to `https://yourdomain.com/auth/microsoft/callback`

4. **Rate limiting**
   - Add rate limiting to auth endpoints
   - Respect Microsoft Graph throttling limits

### Polling

1. **Configurable intervals**
   - Currently 60 seconds
   - Adjust based on needs

2. **Smarter fetching**
   - Use pagination for large datasets
   - Filter by date to avoid duplicate processing
   - Implement idempotent activity creation

3. **Error recovery**
   - Retry failed requests
   - Exponential backoff
   - Alert on repeated failures

### Scaling

- Move token cache to Redis
- Use job queue (Bull, BullMQ) for polling
- Implement proper logging (Winston, Pino)
- Add monitoring/alerting

## API Reference

### POST /auth/microsoft

Redirects to Microsoft login page.

### GET /auth/microsoft/callback

OAuth callback handler. Exchanges code for token.

### GET /auth/status

Check if user is authenticated.

```json
{
  "authenticated": true,
  "message": "User is authenticated"
}
```

### POST /auth/logout

Clear authentication token.

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /activities

List all activities.

```json
[
  {
    "id": 1,
    "type": "email",
    "start_time": "2026-05-02T09:00:00Z",
    "end_time": "2026-05-02T09:01:00Z",
    "source": "outlook",
    "metadata": "{...}"
  }
]
```

### POST /sync/outlook

Manually trigger Outlook sync. Requires authentication.

```json
{
  "success": true,
  "message": "Outlook sync completed"
}
```

### GET /health

Server health check.

```json
{
  "status": "healthy",
  "database": "connected",
  "microsoftAuth": "configured",
  "outlookPolling": "active"
}
```

## Testing

### Test Authentication Flow

```bash
# 1. Start server
npm start

# 2. In another terminal, trigger login
curl http://localhost:3001/auth/microsoft

# 3. Follow redirect, authenticate, and you'll get callback response

# 4. Check status
curl http://localhost:3001/auth/status

# 5. Sync Outlook (with auth)
curl -X POST http://localhost:3001/sync/outlook

# 6. View activities
curl http://localhost:3001/activities
```

### SQLite CLI

```bash
cd backend/db
sqlite3 database.sqlite

# Inside SQLite:
.tables
SELECT * FROM activities WHERE source = 'outlook';
SELECT type, COUNT(*) FROM activities GROUP BY type;
.quit
```

## Next Steps

1. ✅ Register app in Azure
2. ✅ Get credentials (Client ID, Secret)
3. ✅ Set up `.env` file
4. ✅ Run `npm install`
5. ✅ Start server with `npm start`
6. ✅ Visit `http://localhost:3001/auth/microsoft`
7. ✅ Check activities with `curl http://localhost:3001/activities`

## Support

- [Microsoft Graph Docs](https://docs.microsoft.com/en-us/graph)
- [Azure Portal](https://portal.azure.com)
- [MSAL Node Docs](https://github.com/AzureAD/microsoft-authentication-library-for-js)
