// One-time token management for email verification and password resets.
//
// The raw token is returned to the caller (to embed in an emailed link) but only its
// SHA-256 hash is stored, so a database leak can't be used to forge links. Tokens are
// single-use (consumed on success) and expire.

import crypto from "crypto";
import pool from "@/lib/db";

export type TokenType = "email_verify" | "password_reset";

const TTL_MINUTES: Record<TokenType, number> = {
  email_verify: 24 * 60, // 24 hours
  password_reset: 60, // 1 hour
};

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Creates a token for a user, invalidating any prior unused tokens of the same type.
// Returns the raw token to put in the link.
export async function createToken(userId: number, type: TokenType): Promise<string> {
  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const ttl = TTL_MINUTES[type];

  // Invalidate older outstanding tokens of this type so only the newest link works.
  await pool.query(
    `UPDATE auth_tokens SET used_at = NOW() WHERE user_id = $1 AND type = $2 AND used_at IS NULL`,
    [userId, type]
  );

  await pool.query(
    `INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::interval)`,
    [userId, tokenHash, type, ttl]
  );

  return raw;
}

// Validates a raw token and marks it used. Returns the user id, or null if the token is
// invalid, expired, already used, or of the wrong type.
export async function consumeToken(raw: string, type: TokenType): Promise<number | null> {
  if (!raw) return null;
  const tokenHash = hashToken(raw);

  const result = await pool.query(
    `UPDATE auth_tokens
       SET used_at = NOW()
     WHERE token_hash = $1
       AND type = $2
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash, type]
  );

  return result.rows.length ? result.rows[0].user_id : null;
}
