// Supabase Edge Function: email a notification when a contact message is inserted.
//
// Triggered by a Database Webhook on INSERT into public.contact_messages.
// Sends the message to you via Resend. Secrets (set with `supabase secrets set`):
//   RESEND_API_KEY  - from resend.com
//   NOTIFY_TO       - where the notification is sent (your inbox)
//   NOTIFY_FROM     - a verified Resend sender, e.g. "Agrim Sigdel <contact@agrimsigdel.com.np>"
//                     (for quick testing you may use "onboarding@resend.dev")
//   WEBHOOK_SECRET  - shared secret; the webhook must send it as `Authorization: Bearer <secret>`
//
// NOTE: this function must run with verify_jwt = false (see supabase/config.toml).
// The webhook authenticates with the shared secret above, which is not a JWT, so
// the platform gateway would otherwise 401 it before this code runs.
//
// Deno runtime — no build step.

import { renderNotification } from "../_shared/email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_TO = Deno.env.get("NOTIFY_TO");
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "onboarding@resend.dev";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

Deno.serve(async (req) => {
  // Verify the shared secret so only the Supabase webhook can invoke this.
  if (WEBHOOK_SECRET) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  if (!RESEND_API_KEY || !NOTIFY_TO) {
    return new Response("Server not configured", { status: 500 });
  }

  let record: Record<string, unknown> = {};
  try {
    const body = await req.json();
    record = (body?.record ?? body ?? {}) as Record<string, unknown>;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const mail = renderNotification(record);
  const replyTo = String(record.email ?? "");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      reply_to: replyTo || undefined,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(`Email failed: ${detail}`, { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
