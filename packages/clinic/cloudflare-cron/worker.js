// Cloudflare Cron Trigger -> calls the clinic app's reminder route. The app does the work; this only pings it.
export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(pingReminders(env));
  },

  // Lets you test with `wrangler dev --test-scheduled` or a deployed manual trigger; never exposes the secret.
  async fetch() {
    return new Response("clinic reminder cron worker", { status: 200 });
  },
};

async function pingReminders(env) {
  if (!env.APP_URL || !env.CRON_SECRET) {
    throw new Error("APP_URL and CRON_SECRET must be set");
  }
  const url = new URL("/api/clinic/cron/reminders", env.APP_URL);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    signal: AbortSignal.timeout(25_000),
  });
  // Status only: the body is a count summary, and a failure here should show in Cloudflare's cron logs.
  if (!response.ok) {
    throw new Error(`Reminder route returned HTTP ${response.status}`);
  }
  console.log(`reminders ok: ${await response.text()}`);
}
