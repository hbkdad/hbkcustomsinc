import { EmailMessage } from "cloudflare:email";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildRawEmail(payload) {
  const from = "alerts@hbkcustoms.ca";
  const to = "alerts@hbkcustoms.ca";
  const subject = `New HBK lead: ${clean(payload.businessName) || "Trade quote request"}`;
  const textBody = [
    "New HBK Quote Request",
    "====================",
    "",
    `Business: ${clean(payload.businessName)}`,
    `Name: ${clean(payload.name)}`,
    `Email: ${clean(payload.email)}`,
    `Phone: ${clean(payload.phone)}`,
    `Trade: ${clean(payload.trade)}`,
    `Service area: ${clean(payload.serviceArea)}`,
    `Service needed: ${clean(payload.serviceType)}`,
    `Timeline: ${clean(payload.timeline) || "Not provided"}`,
    `Budget: ${clean(payload.budgetRange) || "Not provided"}`,
    `Website: ${clean(payload.websiteUrl) || "Not provided"}`,
    "",
    "Project summary:",
    clean(payload.projectSummary) || "Not provided",
    "",
    "Extra notes:",
    clean(payload.notes) || "Not provided",
    "",
    "Lead source: app.hbkcustoms.ca"
  ].join("\n");

  const htmlBody = `
    <h1>New HBK Quote Request</h1>
    <p><strong>Business:</strong> ${escapeHtml(payload.businessName)}</p>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
    <p><strong>Trade:</strong> ${escapeHtml(payload.trade)}</p>
    <p><strong>Service area:</strong> ${escapeHtml(payload.serviceArea)}</p>
    <p><strong>Service needed:</strong> ${escapeHtml(payload.serviceType)}</p>
    <p><strong>Timeline:</strong> ${escapeHtml(payload.timeline) || "Not provided"}</p>
    <p><strong>Budget:</strong> ${escapeHtml(payload.budgetRange) || "Not provided"}</p>
    <p><strong>Website:</strong> ${escapeHtml(payload.websiteUrl) || "Not provided"}</p>
    <h2>Project summary</h2>
    <p>${escapeHtml(payload.projectSummary).replaceAll("\n", "<br>") || "Not provided"}</p>
    <h2>Extra notes</h2>
    <p>${escapeHtml(payload.notes).replaceAll("\n", "<br>") || "Not provided"}</p>
    <p><strong>Lead source:</strong> app.hbkcustoms.ca</p>
  `.trim();

  const boundary = `hbk-${crypto.randomUUID()}`;

  const raw = [
    `From: HBK Alerts <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    textBody,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    htmlBody,
    "",
    `--${boundary}--`
  ].join("\r\n");

  return new EmailMessage(from, to, raw);
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405);
    }

    const authHeader = clean(request.headers.get("x-hbk-notify-secret"));
    if (!env.NOTIFIER_SHARED_SECRET || authHeader !== env.NOTIFIER_SHARED_SECRET) {
      return json({ error: "Unauthorized." }, 401);
    }

    let payload;

    try {
      payload = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    try {
      await env.EMAIL.send(buildRawEmail(payload));
      return json({ ok: true });
    } catch (error) {
      return json({ error: error.message || "Could not send email." }, 500);
    }
  }
};
