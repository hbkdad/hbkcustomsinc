ALTER TABLE quotes ADD COLUMN lead_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE quotes ADD COLUMN internal_notes TEXT;
CREATE INDEX IF NOT EXISTS idx_quotes_lead_status ON quotes(lead_status);
