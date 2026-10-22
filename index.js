export default {
  async fetch(request, env, ctx) {
    // Пример того, как ваши эндпоинты могут работать с базой D1
    // const { results } = await env.DB.prepare("SELECT * FROM events").all();
    
    return new Response("Worker is running!", {
      headers: { "Content-Type": "text/plain" }
    });
  },
};
