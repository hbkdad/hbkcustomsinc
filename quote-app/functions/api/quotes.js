function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isAuthorized(request, env) {
  const configuredCode = clean(env.DASHBOARD_ACCESS_CODE);

  if (!configuredCode) {
    return false;
  }

  const url = new URL(request.url);
  const queryCode = clean(url.searchParams.get("access_code"));
  const headerCode = clean(request.headers.get("x-access-code"));

  return queryCode === configuredCode || headerCode === configuredCode;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized dashboard access." }, 401);
  }

  const rows = await env.QUOTE_DB.prepare(
    `SELECT
      id,
      created_at,
      name,
      business_name,
      email,
      phone,
      trade,
      service_area,
      service_type,
      timeline,
      budget_range,
      website_url,
      project_summary,
      notes,
      lead_status,
      internal_notes
    FROM quotes
    ORDER BY created_at DESC
    LIMIT 100`
  ).all();

  return json({
    ok: true,
    leads: rows.results || []
  });
}

export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const record = {
    name: clean(body.name),
    business_name: clean(body.businessName),
    email: clean(body.email),
    phone: clean(body.phone),
    trade: clean(body.trade),
    service_area: clean(body.serviceArea),
    service_type: clean(body.serviceType),
    timeline: clean(body.timeline),
    budget_range: clean(body.budgetRange),
    website_url: clean(body.websiteUrl),
    project_summary: clean(body.projectSummary),
    notes: clean(body.notes)
  };

  if (!record.name || !record.business_name || !record.email || !record.phone || !record.trade || !record.service_type || !record.project_summary) {
    return json({ error: "Missing required fields." }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await env.QUOTE_DB.prepare(
    `INSERT INTO quotes (
      id,
      created_at,
      name,
      business_name,
      email,
      phone,
      trade,
      service_area,
      service_type,
      timeline,
      budget_range,
      website_url,
      project_summary,
      notes,
      lead_status,
      internal_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    createdAt,
    record.name,
    record.business_name,
    record.email,
    record.phone,
    record.trade,
    record.service_area,
    record.service_type,
    record.timeline,
    record.budget_range,
    record.website_url,
    record.project_summary,
    record.notes,
    "new",
    ""
  ).run();

  return json({
    ok: true,
    id
  }, 201);
}

export async function onRequestPatch({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized dashboard access." }, 401);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const id = clean(body.id);
  const leadStatus = clean(body.leadStatus) || "new";
  const internalNotes = clean(body.internalNotes);
  const allowedStatuses = new Set(["new", "follow-up", "quoted", "won", "closed"]);

  if (!id) {
    return json({ error: "Missing lead id." }, 400);
  }

  if (!allowedStatuses.has(leadStatus)) {
    return json({ error: "Invalid lead status." }, 400);
  }

  const result = await env.QUOTE_DB.prepare(
    `UPDATE quotes
    SET lead_status = ?, internal_notes = ?
    WHERE id = ?`
  ).bind(
    leadStatus,
    internalNotes,
    id
  ).run();

  if (!result.success) {
    return json({ error: "Could not update lead." }, 500);
  }

  if ((result.meta?.changes || 0) < 1) {
    return json({ error: "Lead not found." }, 404);
  }

  return json({
    ok: true,
    id,
    leadStatus,
    internalNotes
  });
}
