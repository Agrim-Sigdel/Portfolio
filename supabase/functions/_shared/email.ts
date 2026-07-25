// Shared email rendering for the portfolio's transactional mail.
//
// Two templates, one shell, so incoming notifications and outgoing replies look
// like the same site:
//   renderNotification() - sent to YOU when someone submits the contact form
//   renderReply()        - sent to THEM when you reply from /admin
//
// Email-client constraints that drive the odd-looking markup below:
//   - No webfonts. Gmail/Outlook strip @font-face, so Fraunces falls back to
//     Georgia (the closest ubiquitous serif) and Instrument Sans to the system
//     sans stack. Declaring them first still picks them up in clients that cache
//     them locally.
//   - No CSS custom properties, no <style> reliability in Gmail: every rule is
//     inlined on the element.
//   - Tables, not flex/grid: Outlook's Word rendering engine supports neither.
//   - max-width on a table is ignored by Outlook, hence the fixed 600px width.

const BRAND = {
  bg: "#f2f1ee",      // page ground, a warm off-white rather than pure grey
  panel: "#ffffff",   // the card
  inset: "#f7f6f3",   // quoted/message blocks that need to sit back from the card
  border: "#e4e2dd",
  text: "#1a1a1a",
  muted: "#6b6b6b",
  accent: "#ff4c2b",  // decorative only (the top rule) — only 3.3:1 on white, fails AA as text
  link: "#c2340f",    // darkened accent: 5.5:1 on white, passes AA for body-size text
  serif: "'Fraunces', Georgia, 'Times New Roman', serif",
  sans: "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  site: "agrimsigdel.com.np",
  siteUrl: "https://agrimsigdel.com.np",
};

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

/** Preserve author line breaks without letting raw HTML through. */
const escMultiline = (s: unknown) => esc(s).replace(/\r?\n/g, "<br />");

/**
 * Wrap body content in the branded dark shell.
 *
 * `preheader` is the grey snippet line inboxes show next to the subject. It is
 * hidden in the body itself via the zero-size + hidden-colour trick; without it
 * clients scrape whatever text comes first, which reads as noise.
 */
function shell(opts: { heading?: string; preheader: string; body: string; title: string }) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(opts.title)}</title>
<style>
  /* Apple Mail and Outlook.com auto-invert light emails when the reader is in
     dark mode, which turns the warm off-white into muddy grey and drags the
     accent with it. Declaring light-only above stops most clients; these
     overrides re-assert the palette in the ones that invert anyway. */
  :root { color-scheme: light; supported-color-schemes: light; }
  @media (prefers-color-scheme: dark) {
    .body-bg { background: ${BRAND.bg} !important; }
    .card    { background: ${BRAND.panel} !important; }
    .inset   { background: ${BRAND.inset} !important; }
    .t-main  { color: ${BRAND.text} !important; }
    .t-mute  { color: ${BRAND.muted} !important; }
    .t-link  { color: ${BRAND.link} !important; }
  }
</style>
</head>
<body class="body-bg" style="margin:0;padding:0;background:${BRAND.bg};">
  <div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(opts.preheader)}</div>
  <table role="presentation" class="body-bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:14px;overflow:hidden;">
          <tr><td style="height:3px;background:${BRAND.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td class="t-main" style="padding:30px 34px;font-family:${BRAND.sans};font-size:15px;line-height:1.65;color:${BRAND.text};">
              ${opts.heading ? `<h1 class="t-main" style="margin:0 0 18px;font-family:${BRAND.serif};font-size:24px;line-height:1.25;font-weight:600;color:${BRAND.text};">${esc(opts.heading)}</h1>` : ""}
              ${opts.body}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 34px 26px;border-top:1px solid ${BRAND.border};">
              <p class="t-mute" style="margin:0;font-family:${BRAND.sans};font-size:12px;line-height:1.6;color:${BRAND.muted};">
                <a class="t-mute" href="${BRAND.siteUrl}" style="color:${BRAND.muted};text-decoration:underline;">${esc(BRAND.site)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface ContactRecord {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
}

/** Notification to the site owner that a new message landed. */
export function renderNotification(record: ContactRecord) {
  const name = String(record.name ?? "Someone");
  const email = String(record.email ?? "");
  const phone = record.phone ? String(record.phone) : "";
  const message = String(record.message ?? "");

  const row = (label: string, value: string) => `
    <tr>
      <td class="t-mute" style="padding:0 0 6px;font-family:${BRAND.sans};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};width:70px;vertical-align:top;">${esc(label)}</td>
      <td class="t-main" style="padding:0 0 6px;font-family:${BRAND.sans};font-size:14px;color:${BRAND.text};">${value}</td>
    </tr>`;

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
      ${row("From", esc(name))}
      ${row("Email", `<a class="t-link" href="mailto:${esc(email)}" style="color:${BRAND.link};text-decoration:none;">${esc(email)}</a>`)}
      ${phone ? row("Phone", esc(phone)) : ""}
    </table>
    <div class="inset" style="background:${BRAND.inset};border:1px solid ${BRAND.border};border-radius:10px;padding:18px 20px;">
      <p class="t-main" style="margin:0;font-family:${BRAND.sans};font-size:15px;line-height:1.7;color:${BRAND.text};">${escMultiline(message)}</p>
    </div>
    <p class="t-mute" style="margin:22px 0 0;font-family:${BRAND.sans};font-size:13px;color:${BRAND.muted};">Reply straight from this email, or from the admin inbox.</p>`;

  // Concatenated, not filter(Boolean) on an array: the blank lines are real
  // paragraph breaks and filtering falsy entries would collapse them along with
  // the optional phone row.
  let text = `New message via ${BRAND.site}\n\nFrom:  ${name}\nEmail: ${email}\n`;
  if (phone) text += `Phone: ${phone}\n`;
  text += `\n${message}`;

  return {
    subject: `Portfolio contact from ${name}`,
    html: shell({
      heading: "New contact message",
      title: "New contact message",
      preheader: `${name}: ${message.slice(0, 90)}`,
      body,
    }),
    text,
  };
}

/**
 * Mail you send from the admin inbox — either a reply or a fresh compose.
 *
 * Deliberately has no <h1>: the subject is already displayed by the receiving
 * client directly above the body, so repeating it inside just pushes the actual
 * message down. The site name appears exactly once, in the footer.
 *
 * `greet: false` suppresses the automatic "Hi <name>," for composed mail, where
 * you write your own opening.
 */
export function renderReply(opts: {
  toName?: string;
  body: string;
  subject: string;
  quoted?: string;
  greet?: boolean;
}) {
  const wantsGreeting = opts.greet !== false;
  const greeting = opts.toName ? `Hi ${esc(opts.toName)},` : "Hi,";

  const quotedBlock = opts.quoted
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
         <tr><td style="border-top:1px solid ${BRAND.border};padding:16px 0 0;">
           <p class="t-mute" style="margin:0 0 8px;font-family:${BRAND.sans};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.muted};">Your message</p>
           <p class="t-mute" style="margin:0;font-family:${BRAND.sans};font-size:13px;line-height:1.65;color:${BRAND.muted};">${escMultiline(opts.quoted)}</p>
         </td></tr>
       </table>`
    : "";

  const body = `
    ${wantsGreeting ? `<p class="t-main" style="margin:0 0 14px;font-family:${BRAND.sans};font-size:15px;line-height:1.7;color:${BRAND.text};">${greeting}</p>` : ""}
    <p class="t-main" style="margin:0;font-family:${BRAND.sans};font-size:15px;line-height:1.7;color:${BRAND.text};">${escMultiline(opts.body)}</p>
    <p class="t-main" style="margin:26px 0 0;font-family:${BRAND.serif};font-size:16px;color:${BRAND.text};">Agrim Sigdel</p>
    ${quotedBlock}`;

  // Built by concatenation rather than filter(Boolean) on an array: the blank
  // lines here are meaningful paragraph breaks, and filter(Boolean) would eat them.
  const plainGreeting = opts.toName ? `Hi ${opts.toName},` : "Hi,";
  let text = wantsGreeting ? `${plainGreeting}\n\n` : "";
  text += `${opts.body}\n\nAgrim Sigdel\n${BRAND.site}`;
  if (opts.quoted) text += `\n\n---\nYour message:\n${opts.quoted}`;

  return {
    subject: opts.subject,
    html: shell({ title: opts.subject, preheader: opts.body.slice(0, 110), body }),
    text,
  };
}
