# Clinic build progress (FINAL)

Plan: `C:\Users\timlo\.claude\plans\pure-zooming-muffin.md`. Last updated 17 Nov 2026, about 23:30 NZDT.

## Status: MVP items 1-6 complete and verified

| # | Item | Verified by |
|---|------|-------------|
| 1 | CLINIC_MODE nav/settings/Kbar hiding, redirects, labels, rebrand env | browser + curl (307 redirects) |
| 2 | Service + location catalog, admin CRUD, practitioner assignment -> EventType sync | browser + DB + integration tests |
| 3 | Public /book flow, required patient phone (NZ +64 default) | browser, real booking |
| 4 | Webhook -> patients, intake form (/intake/[token]), reminder scheduling | signed curl + real Cal.com webhooks |
| 5 | /clinic/reception (day/week/staff, no-show), /clinic/patients (restricted answers) | browser, two roles |
| 6 | 24h reminder cron (Bearer CRON_SECRET), security pass + route-guard regression test | curl, integration test |

## Verification results
- Unit tests: 137 pass (`TZ=UTC yarn vitest run packages/clinic`). Integration tests (need the local DB): 11 pass (`VITEST_MODE=integration`).
- Upstream tests for patched areas pass with clinic mode on AND off (i18n, shell, lib, emails: 488 tests each).
- Type-check (`apps/web`, `NODE_OPTIONS=--max-old-space-size=12288 yarn tsc --noEmit`): **0 errors in clinic code and on every patched upstream line.** About 1,530 other errors exist in untouched upstream files (tRPC router type inference collapses in this environment). They are not from this work, but the full upstream baseline was not compared.
- End-to-end (local; nothing leaves the machine: SMTP localhost:1025 not listening, no credentials, no integrations): a real booking via /book created the patient, intake form and reminder rows through Cal.com's own webhook. A real reschedule marked the old link RESCHEDULED, cancelled the old reminder, and moved the intake form to the new booking with a recalculated expiry.

## NOT verified / needs you before going live
- **`next build` was never run** (CLAUDE.md says to ask first). A working dev server does not prove the production build passes. Run it before deploying.
- **Resend email transport is implemented but not tested against the live API.** Set `CLINIC_EMAIL_TRANSPORT=resend`, `RESEND_API_KEY` and `CLINIC_EMAIL_FROM` (domain verified in Resend). Unit-tested with a mocked `fetch`; default stays `log`, so nothing is sent until you opt in. Reminders previously built the email but only logged; they now send the built email.
- **Reminder cron runs on Cloudflare, not Vercel.** `packages/clinic/cloudflare-cron/` is a Worker (Cron Trigger every 5 min) that calls `/api/clinic/cron/reminders` with the Bearer secret. Not deployed or tested against Cloudflare; see its README. Set the same `CRON_SECRET` on the app and the Worker. No `vercel.json` change needed.
- **Cal.com logos/images** in `apps/web/public` and the Booker footer logo are still Cal.com's (trademark; needs your artwork).
- **Hosting region** for health data (NZ HIPC) is still undecided; `.env` here is local-only.
- **AGPL:** the fork must stay AGPL if hosted for clinics; `/ee` is not enabled.

## Deliberate deviations
- Price is stored and shown on /book but not synced to the EventType: the Booker only shows a price via payment-app metadata, which starts a payment flow. Payments are out of scope.
- Clinic code lives in `packages/clinic`, not `apps/web/modules/*`.

## Known follow-ups (small)
- Booker page still shows the Cal.com footer logo.
- A practitioner with the username `book` would be shadowed by the static /book route.
- `@types/react` 18.0.26 forced the `ActionForm` cast; remove it when the React types are upgraded.
- Local dev data from testing: test patients, bookings 31/32 (e2e.patient@example.com), and `pro@example.com` has a ClinicStaffRole admin row.

## Not started (need provider decisions; "after the MVP" in the plan)
SMS reminders, telehealth UI, patient notes, waitlist, payments, reporting.
