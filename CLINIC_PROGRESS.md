# Clinic build progress

Updated each loop iteration. Plan: `C:\Users\timlo\.claude\plans\pure-zooming-muffin.md`.

## Done
- Fork of Cal.com v6.2.0, `packages/clinic`, `NEXT_PUBLIC_CLINIC_MODE` nav/settings/label hooks (c83172f, 225915b)
- Local Postgres 16 on D:, migrations + seed, Turbopack dev server working
- Item 1: Kbar actions hidden, /teams /workflows /routing /insights redirect, rebrand env vars (local .env + `clinic.env.example`), Patient/Practitioner labels confirmed on public booking page

- Item 2 (part): Clinic catalog Prisma models + migration `20261117000000_clinic_catalog`; `syncAssignment` (service -> EventType: create/update/hide/recreate) with unit tests and a DB integration test (`VITEST_MODE=integration yarn vitest run packages/clinic/src/services/prismaSyncDeps.integration-test.ts`)

- Item 2 (part): /clinic/services admin page (list, create, edit, activate/deactivate) via server actions; clinic roles (`resolveClinicRole`: instance ADMIN -> clinic admin, else practitioner unless ClinicStaffRole row); browser-verified create + toggle (46fe92d)
- Item 2 DONE: /clinic/locations admin (27c3af4); practitioner assignment UI on service edit page -> EventType created and bookable at /pro/initial-consultation-auckland-cbd-clinic (browser + DB verified); assignment integration tests

## In progress
- Item 3: public /book flow

## Blocked / needs your decision
- Replace Cal.com logos/images in `apps/web/public` with clinic branding (needs your artwork)

## Next
- Item 3: /book page (choose practitioner or service -> hand off to existing Booker for the assignment's EventType); require patient phone booking field on clinic EventTypes
- Then items 4-6

## Notes
- Local dev: pro@example.com has a ClinicStaffRole admin row (dev data only) so it can open admin pages.
- After `prisma generate`, restart the dev server or new Clinic models are undefined in the running app.
- ClinicService.priceCents is stored but NOT synced to the EventType (payments are out of MVP scope).
- Video locations map to Google Meet (`integrations:google:meet`), which needs a Google calendar connection per practitioner; phone = booker's number.
