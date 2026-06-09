// Transactional email sending.
//
// In production, set RESEND_API_KEY and EMAIL_FROM to send real email via Resend.
// In development (no key), the email is printed to the server console instead — so
// you can copy the reset/verify link straight from your terminal without setting up
// an email provider. Returns { devLink } in that case so callers can surface it locally.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Best Texas Display <noreply@besttexasdisplay.com>";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  // The primary action link in the email — logged to console in dev mode.
  devLink?: string;
}

export async function sendEmail({ to, subject, html, devLink }: SendArgs): Promise<{ sent: boolean; devLink?: string }> {
  // Dev fallback: no provider configured -> log to console instead of sending.
  if (!RESEND_API_KEY) {
    console.log("\n📧 [DEV EMAIL — not actually sent; configure RESEND_API_KEY to send for real]");
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    if (devLink) console.log(`   Link:    ${devLink}`);
    console.log("");
    // Never expose the link in the HTTP response in production — that would let anyone
    // reset/confirm another user's account. Only surface it for local development.
    const exposeLink = process.env.NODE_ENV !== "production";
    return { sent: false, devLink: exposeLink ? devLink : undefined };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }

  return { sent: true };
}

// --- Templates -------------------------------------------------------------

function layout(heading: string, body: string, buttonLabel: string, buttonUrl: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1B3A5C;">
    <h1 style="font-size: 22px; color: #1B3A5C;">Best<span style="color:#C0392B;">Texas</span>Display</h1>
    <h2 style="font-size: 18px; margin-top: 24px;">${heading}</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #374151;">${body}</p>
    <p style="margin: 28px 0;">
      <a href="${buttonUrl}" style="background:#C0392B; color:#fff; text-decoration:none; padding:12px 24px; border-radius:10px; font-weight:bold; display:inline-block;">${buttonLabel}</a>
    </p>
    <p style="font-size: 13px; color: #6B7280;">If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${buttonUrl}" style="color:#C0392B; word-break:break-all;">${buttonUrl}</a>
    </p>
    <p style="font-size: 12px; color: #9CA3AF; margin-top: 28px;">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}

export function verificationEmail(link: string): { subject: string; html: string } {
  return {
    subject: "Confirm your email — Best Texas Display",
    html: layout(
      "Confirm your email",
      "Thanks for joining Best Texas Display! Please confirm your email address to finish setting up your account.",
      "Confirm Email",
      link
    ),
  };
}

export function passwordResetEmail(link: string): { subject: string; html: string } {
  return {
    subject: "Reset your password — Best Texas Display",
    html: layout(
      "Reset your password",
      "We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.",
      "Reset Password",
      link
    ),
  };
}
