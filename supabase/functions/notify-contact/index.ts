// Supabase Edge Function: email a notification when a contact message is inserted.
//
// Triggered by a Database Webhook on INSERT into public.contact_messages.
// Sends the message to you via Resend. Secrets (set with `supabase secrets set`):
//   RESEND_API_KEY  - from resend.com
//   NOTIFY_TO       - where the notification is sent (your inbox)
//   NOTIFY_FROM     - a verified Resend sender, e.g. "Portfolio <noreply@your-domain>"
//                     (for quick testing you may use "onboarding@resend.dev")
//   WEBHOOK_SECRET  - shared secret; the webhook must send it as `Authorization: Bearer <secret>`
//
// Deno runtime — no build step.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_TO = Deno.env.get("NOTIFY_TO");
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "onboarding@resend.dev";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

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
    record = body?.record ?? body ?? {};
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const name = String(record.name ?? "Someone");
  const email = String(record.email ?? "");
  const phone = record.phone ? String(record.phone) : "";
  const message = String(record.message ?? "");

  const html = `
    <h2>New contact message</h2>
    <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
    ${phone ? `<p><strong>Phone:</strong> ${esc(phone)}</p>` : ""}
    <p style="white-space:pre-wrap">${esc(message)}</p>
    <hr />
    <p style="color:#888;font-size:12px">Sent from your portfolio contact form.</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      reply_to: email || undefined,
      subject: `Portfolio contact from ${name}`,
      html,
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
