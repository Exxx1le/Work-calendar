export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/data") {
      try {
        if (request.method === "GET") {
          const row = await env.DB
            .prepare("SELECT payload FROM calendar_state WHERE id = 1")
            .first();

          const data = row
            ? JSON.parse(row.payload)
            : { users: {}, currentUserName: "" };

          return Response.json(data, {
            headers: { "Cache-Control": "no-store" }
          });
        }

        if (request.method === "PUT") {
          const body = await request.json();

          if (
            !body ||
            typeof body.users !== "object" ||
            body.users === null ||
            Array.isArray(body.users)
          ) {
            return Response.json(
              { error: "Неверный формат данных календаря." },
              { status: 400 }
            );
          }

          const payload = JSON.stringify({
            users: body.users,
            currentUserName:
              typeof body.currentUserName === "string"
                ? body.currentUserName
                : ""
          });

          await env.DB.prepare(`
            INSERT INTO calendar_state (id, payload, updated_at)
            VALUES (1, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              payload = excluded.payload,
              updated_at = CURRENT_TIMESTAMP
          `).bind(payload).run();

          return Response.json({ ok: true });
        }

        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "GET, PUT" }
        });
      } catch (error) {
        return Response.json(
          { error: "Ошибка API: " + error.message },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
