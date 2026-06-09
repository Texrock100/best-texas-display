-- Auth feature migration: email verification, password reset, login tracking.
-- Safe to run multiple times (idempotent).

-- Track whether a user has confirmed their email, and when they last logged in.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- One-time tokens for email verification and password resets.
-- Only the SHA-256 hash of the token is stored; the raw token lives only in the emailed link.
CREATE TABLE IF NOT EXISTS auth_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email_verify', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
