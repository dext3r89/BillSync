# BillSync

**Legal Activity Tracking & Automated Billing System**

BillSync is a full-stack application for law firms that automatically captures billable time across emails, meetings, documents, and manual activities, classifies them by client and matter, generates professional billing narrations, and computes billing entries — all with minimal attorney intervention.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Billing Calculation](#billing-calculation)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Features

- **Automated Outlook capture** — polls Microsoft Graph for emails and calendar events and converts them to activity records
- **Document tracking** — monitors a local directory for file activity via a file system watcher
- **Rule-based classification** — assigns client, task type, billability, and a confidence score using keyword and regex matching
- **Matter matching** — scores activities against configured legal matters using keyword overlap
- **Narration generation** — produces short (≤150 char) and extended (≤500 char) billing narrations per activity type
- **Manual activity entry** — supports ad-hoc Calls, SMS, and WhatsApp entries with duration or quantity billing
- **Billing computation** — converts activities to billable entries with unit, billed-minute, and cost calculations
- **Review workflow** — allows attorneys to correct, update, or decline auto-captured activities via PATCH endpoint
- **Microsoft OAuth** — full authorization code flow via MSAL Node for Outlook integration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express |
| Database | SQLite (via `sqlite` / `sqlite3`) |
| Auth | MSAL Node (`@azure/msal-node`) — Microsoft OAuth 2.0 |
| Email/Calendar | Microsoft Graph API (via `axios`) |
| File Watching | Chokidar |
| Analytics | Vercel Analytics (production only) |

---

## Project Structure

```
billsync/
├── db/
│   ├── database.js          # SQLite connection initializer
│   ├── dbInstance.js        # Singleton DB accessor (getDB/setDB)
│   └── schema.sql           # Table definitions (activities, matters, time_entries)
├── config/
│   └── classificationRules.js  # Client and task type keyword dictionaries
├── routes/
│   ├── activityRoutes.js    # GET/POST/PATCH /activities
│   ├── authRoutes.js        # Microsoft OAuth flow endpoints
│   └── billingRoutes.js     # GET /billing/entries
├── services/
│   ├── activityService.js   # Core enrichment pipeline, CRUD
│   ├── aiEnhancementService.js  # OpenAI integration stub
│   ├── billingService.js    # Unit/duration billing calculation
│   ├── classificationService.js # Keyword + regex classification
│   ├── matterService.js     # Matter keyword matching
│   ├── microsoftAuthService.js  # MSAL token management
│   ├── narrationService.js  # Billing narration generation
│   └── outlookService.js    # Graph API polling + activity creation
├── server.js                # Express app entry point
├── documentservice/         # File watcher (Chokidar)
└── frontend/
    ├── app/
    │   ├── layout.tsx       # Root HTML shell, fonts, metadata
    │   └── page.tsx         # Marketing landing page
    └── components/ui/       # shadcn/ui component library
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- An Azure AD application registration (for Outlook integration — optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/dext3r89/BillSync.git
cd BillSync

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Running the Backend

```bash
# Copy and configure environment variables
cp .env.example .env

# Start the server
node server.js
# Server starts on http://localhost:3001
```

### Running the Frontend

```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:3000
```

### First-Time Setup

1. Start the backend — the SQLite database is created automatically on first run.
2. (Optional) Authenticate with Microsoft via `GET /auth/microsoft` to enable Outlook polling.
3. Add matters to the database to enable matter matching (see [API Reference](#api-reference)).
4. Open `http://localhost:3000` to access the frontend.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Microsoft Graph (required for Outlook integration)
MS_CLIENT_ID=your-azure-app-client-id
MS_CLIENT_SECRET=your-azure-app-client-secret
REDIRECT_URI=http://localhost:3001/auth/microsoft/callback

# OpenAI (optional — AI enhancement not yet implemented)
OPENAI_API_KEY=your-openai-api-key
```

To obtain `MS_CLIENT_ID` and `MS_CLIENT_SECRET`, register an application in the [Azure portal](https://portal.azure.com) and grant it `Mail.Read`, `Calendars.Read`, and `User.Read` API permissions.

---

## API Reference

### Activities

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/activities` | List all activities. Query: `client`, `taskType`, `billable`, `minConfidence`, `limit` |
| `GET` | `/activities/stats` | Daily activity count, average confidence, total daily hours |
| `POST` | `/activities/manual` | Create a manual Call / SMS / WhatsApp entry |
| `PATCH` | `/activities/:id` | Update enrichment fields or decline an activity |

**Manual activity body:**
```json
{
  "type": "Call",
  "date": "2025-05-01",
  "duration": 15,
  "client": "Eskom",
  "matter": "ESKOM-2024-001",
  "narration": "Telephone consultation re contract terms"
}
```

**Decline an activity:**
```json
{ "action": "decline" }
```

### Billing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/billing/entries` | Computed billing entries for all billable activities. Query: `increment` (default: 6), `ratePerUnit` (default: 100) |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/microsoft` | Redirect to Microsoft login |
| `GET` | `/auth/microsoft/callback` | OAuth callback handler |
| `GET` | `/auth/status` | Returns `{ authenticated: true/false }` |
| `POST` | `/auth/logout` | Clears token cache |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server, database, auth, and watcher status |
| `POST` | `/sync/outlook` | Manually trigger an Outlook data poll |

---

## How It Works

### Automatic Activity Capture

```
Microsoft Outlook
      │
      ▼
outlookService.pollOutlookData()
      │  fetches emails + calendar events
      ▼
activityService.createActivity()
      │
      ├─► classificationService  → client, task type, confidence
      ├─► matterService          → best matching matter code
      ├─► narrationService       → billing narration
      └─► aiEnhancementService   → (stub) low-confidence enhancement
      │
      ▼
activities table (SQLite)
      │
      ▼
GET /billing/entries → billingService.convertActivityToBillable()
```

### Classification Rules

Client and task type matching is configured in `config/classificationRules.js`. To add a new client:

```javascript
const { addClient } = require('./config/classificationRules');
addClient('new_client', ['keyword1', 'keyword2'], ['ALIAS']);
```

To add a new task type:

```javascript
const { addTaskType } = require('./config/classificationRules');
addTaskType('client_call', ['telephone', 'call', 'phone'], [/call|telephone/i], true);
```

### Billable Task Types (default)

`email_review`, `document_review`, `meeting`, `research`, `drafting`

### Billable Sources (default)

`outlook`, `gmail`, `document`, `manual_entry`

---

## Billing Calculation

### Duration-based (Calls, Emails, Documents, Meetings)

```
duration_minutes = ceil((end_time - start_time) / 60000)
units            = ceil(duration_minutes / increment)
billed_minutes   = units × increment
total_cost       = units × rate_per_unit
```

### Unit-based (SMS, WhatsApp)

```
units       = quantity (from metadata, default: 1)
total_cost  = units × rate_per_unit (default: R40)
```

Default increment: **6 minutes**. Default rate: **R100/unit** (duration), **R40/unit** (SMS/WhatsApp).

---

## Known Limitations


- **Single-user auth**: Tokens are stored in memory. Authentication is lost on server restart and only one user is supported at a time.
- **No API authentication**: Activity and billing endpoints are unprotected. Any client that can reach port 3001 has full access.
- **`time_entries` table unused**: Defined in the schema but not populated by any service.
- **No pagination**: `GET /activities` returns all records without limit.

---

## Roadmap

- [ ] Activity deduplication (unique constraint on source + type + start_time)
- [ ] JWT / session-based API authentication middleware
- [ ] Pagination on `GET /activities`
- [ ] Persistent token storage (Redis or database)
- [ ] OpenAI integration for low-confidence activity enhancement
- [ ] Billing export (CSV / PDF invoice generation)
- [ ] Matter management REST endpoints (CRUD)
- [ ] Formal schema migration system
- [ ] Populate `time_entries` table at point of billing approval

---

## License

Private — All rights reserved. See `LICENSE` for details.
