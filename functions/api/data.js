const MAX_BODY_BYTES = 1_000_000;

export async function onRequestGet({ env }) {
  try {
    const row = await env.DB.prepare("SELECT payload FROM calendar_state WHERE id = 1").first();
    if (!row) return Response.json({ users: {}, currentUserName: "" });
    return new Response(row.payload, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: "Не удалось прочитать базу данных." }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) return Response.json({ error: "Слишком большой объём данных." }, { status: 413 });
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) return Response.json({ error: "Слишком большой объём данных." }, { status: 413 });
    const body = JSON.parse(bodyText);
    if (!body || typeof body !== "object" || !body.users || typeof body.users !== "object" || Array.isArray(body.users)) {
      return Response.json({ error: "Неверный формат данных календаря." }, { status: 400 });
    }
    const cleanUsers = {};
    for (const [rawName, rawUser] of Object.entries(body.users)) {
      const name = String(rawName).trim();
      if (!name || name.length > 100 || !rawUser || typeof rawUser !== "object") continue;
      const color = /^#[0-9a-fA-F]{6}$/.test(rawUser.color) ? rawUser.color : "#3498db";
      const dates = Array.isArray(rawUser.dates) ? [...new Set(rawUser.dates.filter(d => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort() : [];
      if (dates.length > 5000) return Response.json({ error: "Слишком много дат у пользователя." }, { status: 400 });
      cleanUsers[name] = { color, dates };
    }
    const currentUserName = typeof body.currentUserName === "string" && cleanUsers[body.currentUserName] ? body.currentUserName : (Object.keys(cleanUsers)[0] || "");
    const payload = JSON.stringify({ users: cleanUsers, currentUserName });
    await env.DB.prepare("INSERT INTO calendar_state (id, payload, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP").bind(payload).run();
    return Response.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Получен некорректный JSON." }, { status: 400 });
    return Response.json({ error: "Не удалось сохранить данные в базу данных." }, { status: 500 });
  }
}
