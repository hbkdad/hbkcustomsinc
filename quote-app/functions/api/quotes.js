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
      notes
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
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    record.notes
  ).run();

  return json({
    ok: true,
    id
  }, 201);
}
