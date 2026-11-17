# Reminder cron on Cloudflare

Runs every 5 minutes and calls `GET /api/clinic/cron/reminders` on the app with `Authorization: Bearer $CRON_SECRET`.
Reminders are claimed before sending, so an overlapping or repeated run cannot double-send.

Deploy (manual, from this folder; nothing here runs automatically):

1. Edit `APP_URL` in `wrangler.toml`.
2. `npx wrangler login`
3. `npx wrangler secret put CRON_SECRET` (same value as the app's `CRON_SECRET`)
4. `npx wrangler deploy`

Test locally: `npx wrangler dev --test-scheduled`, then open `/__scheduled` on the dev URL.
Logs: `npx wrangler tail`.

The app side needs only `CRON_SECRET` set; no Vercel Cron entry and no `apps/web/vercel.json` change.
