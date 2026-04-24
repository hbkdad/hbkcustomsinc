CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  trade TEXT NOT NULL,
  service_area TEXT,
  service_type TEXT NOT NULL,
  timeline TEXT,
  budget_range TEXT,
  website_url TEXT,
  project_summary TEXT NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
