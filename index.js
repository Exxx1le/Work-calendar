export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Получить состояние календаря (например, GET /api/state)
    if (url.pathname === "/api/state" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM calendar_state WHERE id = 1").all();
        return Response.json(results[0] || {});
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // 2. Обновить состояние календаря (например, POST /api/state)
    if (url.pathname === "/api/state" && request.method === "POST") {
      try {
        const body = await request.json();
        const payloadString = JSON.stringify(body);
        
        await env.DB.prepare(
          "UPDATE calendar_state SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
        ).bind(payloadString).run();

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // Все остальные запросы отдают статические файлы вашего сайта из корня репозитория
    return env.ASSETS.fetch(request);
  },
};
