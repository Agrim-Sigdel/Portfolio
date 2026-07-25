// Supabase Edge Function: send a reply to a contact message, from /admin.
//
// Secrets (in addition to RESEND_API_KEY):
//   REPLY_FROM  - verified Resend sender, e.g. "Agrim Sigdel <contact@agrimsigdel.com.np>"
//                 The domain must be verified in Resend or every send 403s.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by
// the platform; they do not need to be set manually.
//
// SECURITY, two things worth being explicit about:
//
// 1. verify_jwt alone would NOT protect this endpoint. Your anon key is itself a
//    valid JWT and ships in the public bundle, so gateway JWT verification would
//    happily admit any visitor and hand them a mailer that sends as your domain.
//    We therefore resolve the caller against /auth/v1/user and require a real
//    user; the bare anon key has no `sub` claim and is rejected there.
//
// 2. Two modes, with different recipient handling:
//      messageId -> reply.   Recipient is read from the contact_messages row, so
//                            the reply path cannot be aimed anywhere else.
//      to        -> compose. Recipient comes from the request and is validated
//                            here: exactly one address, no comma lists and no
//                            display names, which keeps this from becoming a bulk
//                            sender and blocks header injection via the address.
//    Compose is therefore only as strong as check (1) — that check is what stops
//    it being an open relay, so do not weaken it.

import { renderReply } from "../_shared/email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const REPLY_FROM = Deno.env.get("REPLY_FROM") ?? Deno.env.get("NOTIFY_FROM") ?? "onboarding@resend.dev";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ALLOWED_ORIGINS = [
  "https://agrimsigdel.com.np",
  "https://www.agrimsigdel.com.np",
  "http://localhost:5173",
];

// supabase-js's functions.invoke() sends `apikey` and `x-client-info` in
// addition to `authorization`. Every header the client sends must be named here
// or the browser fails the preflight and the request never reaches this code.
const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  if (!RESEND_API_KEY || !SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    return json({ error: "Server not configured" }, 500, origin);
  }

  // --- authenticate: must be a logged-in user, not merely a valid JWT ---------
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401, origin);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return json({ error: "Not signed in" }, 401, origin);
  const user = await userRes.json();
  if (!user?.id || user?.role !== "authenticated") {
    return json({ error: "Not signed in" }, 401, origin);
  }

  // --- validate input --------------------------------------------------------
  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Bad payload" }, 400, origin);
  }

  const messageId = Number(payload.messageId);
  const bodyText = String(payload.body ?? "").trim();
  const subjectIn = String(payload.subject ?? "").trim();
  const includeQuote = payload.includeQuote !== false;

  const composeTo = String(payload.to ?? "").trim();
  const isReply = Number.isInteger(messageId) && messageId > 0;

  if (!isReply && !composeTo) {
    return json({ error: "Provide either messageId (reply) or to (compose)" }, 400, origin);
  }
  if (!bodyText) return json({ error: "Message body is empty" }, 400, origin);
  if (bodyText.length > 20000) return json({ error: "Message is too long" }, 400, origin);

  let toEmail: string;
  let toName: string | undefined;
  let quoted: string | undefined;

  if (isReply) {
    // Replies resolve the recipient from the row, never from the request body,
    // so the reply path cannot be steered at an arbitrary address.
    const rowRes = await fetch(
      `${SUPABASE_URL}/rest/v1/contact_messages?id=eq.${messageId}&select=id,name,email,message`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (!rowRes.ok) return json({ error: "Lookup failed" }, 502, origin);
    const rows = await rowRes.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.email) return json({ error: "Message not found" }, 404, origin);

    toEmail = String(row.email);
    toName = String(row.name ?? "").split(" ")[0] || undefined;
    quoted = includeQuote ? String(row.message ?? "") : undefined;
  } else {
    // Compose takes the address from the request, so it has to be validated
    // here. Deliberately strict: one address only, no comma lists, no display
    // names — that keeps this from becoming a bulk sender and blocks header
    // injection via newlines in the address.
    if (!/^[^\s@,<>";:]+@[^\s@,<>";:]+\.[^\s@,<>";:]{2,}$/.test(composeTo)) {
      return json({ error: `Not a valid email address: ${composeTo}` }, 400, origin);
    }
    toEmail = composeTo;
  }

  const subject = subjectIn || (isReply ? "Re: your message" : "Message from Agrim Sigdel");
  const mail = renderReply({
    toName,
    subject,
    body: bodyText,
    quoted,
    // Composed mail gets no auto "Hi <name>," — you write your own opening.
    greet: isReply,
  });

  // --- send ------------------------------------------------------------------
  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: REPLY_FROM,
      to: [toEmail],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });

  const sendBody = await sendRes.text();
  if (!sendRes.ok) {
    // Surface Resend's own message — "domain is not verified" is the usual one.
    return json({ error: `Email failed: ${sendBody}` }, 502, origin);
  }

  let resendId: string | null = null;
  try {
    resendId = JSON.parse(sendBody)?.id ?? null;
  } catch { /* non-fatal: the mail went out even if we can't read the id */ }

  // --- record it (service role: the log is admin-read-only under RLS) --------
  await fetch(`${SUPABASE_URL}/rest/v1/contact_replies`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      message_id: isReply ? messageId : null,
      to_email: toEmail,
      subject: mail.subject,
      body: bodyText,
      resend_id: resendId,
      sent_by: user.email ?? null,
    }),
  });

  // Only a reply marks a message answered; composed mail has no message to stamp.
  if (isReply) {
    await fetch(`${SUPABASE_URL}/rest/v1/contact_messages?id=eq.${messageId}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ replied_at: new Date().toISOString() }),
    });
  }

  return json({ ok: true, id: resendId, to: toEmail }, 200, origin);
});
