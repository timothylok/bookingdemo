# Clinic build progress

Updated each loop iteration. Plan: `C:\Users\timlo\.claude\plans\pure-zooming-muffin.md`.

## Done
- Fork of Cal.com v6.2.0, `packages/clinic`, `NEXT_PUBLIC_CLINIC_MODE` nav/settings/label hooks (c83172f, 225915b)
- Local Postgres 16 on D:, migrations + seed, Turbopack dev server working
- Item 1: Kbar actions hidden, /teams /workflows /routing /insights redirect, rebrand env vars (local .env + `clinic.env.example`), Patient/Practitioner labels confirmed on public booking page

- Item 2 (part): Clinic catalog Prisma models + migration `20261117000000_clinic_catalog`; `syncAssignment` (service -> EventType: create/update/hide/recreate) with unit tests and a DB integration test (`VITEST_MODE=integration yarn vitest run packages/clinic/src/services/prismaSyncDeps.integration-test.ts`)

- Item 2 (part): /clinic/services admin page (list, create, edit, activate/deactivate) via server actions; clinic roles (`resolveClinicRole`: instance ADMIN -> clinic admin, else practitioner unless ClinicStaffRole row); browser-verified create + toggle (46fe92d)
- Item 2 DONE: /clinic/locations admin (27c3af4); practitioner assignment UI on service edit page -> EventType created and bookable at /pro/initial-consultation-auckland-cbd-clinic (browser + DB verified); assignment integration tests
- Item 3 DONE: public /book (no login) -> offer cards -> existing Booker; clinic EventTypes require visible patient phone (merged into bookingFields); browser-verified booking form shows Name*, Email*, Phone*
- Item 4 (part): ClinicPatient/ClinicPatientBooking/ClinicFormTemplate/ClinicPatientForm models (migration 20261117010000_clinic_patients_forms, seeds default health questionnaire); POST /api/clinic/webhooks/cal verifies X-Cal-Signature-256, upserts patient + booking, creates one hashed-token intake form per booking (curl-verified: 401 bad sig, 200 create, idempotent redelivery) (22609cb)
- Item 4 DONE: /intake/[token] questionnaire (noindex, template-driven, single-use conditional submit, browser-verified, answers stored) (4d4070c); per-practitioner Cal.com webhook auto-registered on assignment (integration-tested)
- Item 5 (part): /clinic/reception (admin + reception roles) - summary cards, day/week views, staff filter, intake status, no-show toggle; browser-verified with seeded bookings (5339e6b)
- Item 5 DONE: /clinic/patients search + detail; intake answers visible only to admin or the treating practitioner (browser-verified as admin and as reception)
- Item 6 (part): ClinicReminder (migration 20261117020000_clinic_reminders), scheduled/cancelled from webhooks, GET /api/clinic/cron/reminders with Bearer CRON_SECRET (curl-verified 401/401/200), claim-before-send idempotency, integration-tested against seeded bookings

## In progress
- Item 6: security pass across all clinic routes

## Blocked / needs your decision
- Deploy step: add `{ "path": "/api/clinic/cron/reminders", "schedule": "*/5 * * * *" }` to apps/web/vercel.json crons (upstream file) and set CRON_SECRET in Vercel.
- Real email transport for intake/reminder emails (SMTP or provider). Currently CLINIC_EMAIL_TRANSPORT=log only writes the link to the server log.
- Replace Cal.com logos/images in `apps/web/public` with clinic branding (needs your artwork)

## Next
- Item 6: reminders (24h email via log transport) + cron route (protected by CRON secret), cancel on cancellation; then security pass across all clinic routes

## Notes
- Unverified: actual Cal.com -> clinic webhook delivery for a real booking (making a real booking would send emails). Route verified with signed curl requests; SSRF checks only apply to tRPC webhook create/edit, and self-hosted allows private IPs.
- Existing local assignment (pro) predates auto-registration; re-assign or run ensurePractitionerWebhook to register its webhook.
- Local dev data: test patient test.patient@example.com with fake bookingId 999001 (created by a signed curl webhook test).
- Follow-up: Booker phone input defaults to US (+1); should default to NZ.
- Follow-up: Booker footer still shows the Cal.com logo (branding).
- /book is a static route, so a practitioner with username `book` would be shadowed.
- Local dev: pro@example.com has a ClinicStaffRole admin row (dev data only) so it can open admin pages.
- After `prisma generate`, restart the dev server or new Clinic models are undefined in the running app.
- ClinicService.priceCents is stored but NOT synced to the EventType (payments are out of MVP scope).
- Video locations map to Google Meet (`integrations:google:meet`), which needs a Google calendar connection per practitioner; phone = booker's number.
