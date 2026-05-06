CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  source TEXT,
  metadata TEXT,
  client TEXT,
  matter TEXT,
  task_type TEXT,
  billable INTEGER DEFAULT 0,
  confidence REAL DEFAULT 0.0,
  narration TEXT,
  isManual INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  enriched_at TEXT
);

CREATE TABLE IF NOT EXISTS matters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  matter_code TEXT NOT NULL UNIQUE,
  description TEXT,
  keywords TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id INTEGER,
  matter_id INTEGER,
  description TEXT,
  duration INTEGER,
  billable_units INTEGER,
  FOREIGN KEY(activity_id) REFERENCES activities(id),
  FOREIGN KEY(matter_id) REFERENCES matters(id)
);
