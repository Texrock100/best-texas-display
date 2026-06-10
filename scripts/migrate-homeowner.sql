-- Homeowner privacy: consent attestation, takedown requests, and a "removed" status.
-- Safe to run multiple times (idempotent).

-- Record that the submitter attested ownership/permission.
ALTER TABLE displays ADD COLUMN IF NOT EXISTS owner_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE displays ADD COLUMN IF NOT EXISTS consent_at TIMESTAMP WITH TIME ZONE;

-- Allow a "removed" status (homeowner takedown). Keeps the row for the record but
-- hides it from all public surfaces.
ALTER TABLE displays DROP CONSTRAINT IF EXISTS displays_status_check;
ALTER TABLE displays ADD CONSTRAINT displays_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'removed'));

-- Homeowner takedown / preference requests, reviewed by an admin.
CREATE TABLE IF NOT EXISTS removal_requests (
  id SERIAL PRIMARY KEY,
  display_id INTEGER REFERENCES displays(id) ON DELETE CASCADE NOT NULL,
  requester_name VARCHAR(150) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requested_type VARCHAR(20) NOT NULL CHECK (requested_type IN ('remove_location', 'remove_home')),
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_removal_requests_status ON removal_requests(status);
CREATE INDEX IF NOT EXISTS idx_removal_requests_display ON removal_requests(display_id);
