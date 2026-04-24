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

export async function onRequestGet({ env }) {
  const result = await env.QUOTE_DB.prepare(
    "SELECT COUNT(*) AS total FROM quotes"
  ).first();

  return json({
    ok: true,
    total: result?.total || 0
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
