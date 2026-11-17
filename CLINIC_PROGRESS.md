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

## In progress
- Item 4: webhook route + ClinicPatient models

## Blocked / needs your decision
- Replace Cal.com logos/images in `apps/web/public` with clinic branding (needs your artwork)

## Next
- Item 4: Cal.com webhook -> ClinicPatient upsert + ClinicPatientBooking link; ClinicFormTemplate/ClinicPatientForm models; /intake/[token]; intake email (render only, no real send locally)
- Then items 5-6

## Notes
- Follow-up: Booker phone input defaults to US (+1); should default to NZ.
- Follow-up: Booker footer still shows the Cal.com logo (branding).
- /book is a static route, so a practitioner with username `book` would be shadowed.
- Local dev: pro@example.com has a ClinicStaffRole admin row (dev data only) so it can open admin pages.
- After `prisma generate`, restart the dev server or new Clinic models are undefined in the running app.
- ClinicService.priceCents is stored but NOT synced to the EventType (payments are out of MVP scope).
- Video locations map to Google Meet (`integrations:google:meet`), which needs a Google calendar connection per practitioner; phone = booker's number.
