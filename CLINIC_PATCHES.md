# Clinic fork — upstream patch ledger

Base: `calcom/cal.com` **v6.2.0** (remote `upstream`), branch `clinic/main`.

All clinic logic lives in `packages/clinic` (and clinic-only folders in `apps/web`).
Upstream files are touched **only** to call into it. Every such touch is listed below, so an
upstream merge conflict can only appear in these files.

Rules:
- Never delete upstream code to "remove" a feature. Hide it behind `isClinicMode()`.
- Never enable `/ee` features. This fork is AGPL-only and has no Cal.com license key.
- Clinic Prisma models refer to upstream rows by plain Int id columns with no relation fields, so
  upstream models stay untouched.
- New upstream patches must be one-line hooks and must be added to this table.

## Feature flag

`NEXT_PUBLIC_CLINIC_MODE=1` turns on clinic mode. Read via `packages/clinic/src/config.ts`.

## Patched upstream files

| File | Patch | Why |
| --- | --- | --- |
| `apps/web/modules/shell/navigation/Navigation.tsx` | wraps `getNavigationItems(...)` with `applyClinicNavigation(...)` (+3 imports) | hide Teams/Members/Routing/Workflows/Insights, add Reception/Services/Locations/Patients |
| `apps/web/app/(use-page-wrapper)/settings/(settings-layout)/SettingsLayoutAppDirClient.tsx` | `return tabs` → `return applyClinicSettingsTabs(tabs, isClinicMode())` (+2 imports) | hide Billing/Organization/Teams settings |
| `packages/i18n/server.ts` | wraps English translations with `withClinicTranslations(...)` (+2 imports) | Attendee→Patient, Host→Practitioner labels; clinic strings |
| `packages/i18n/package.json` | dependency `@calcom/clinic` | for the hook above |
| `apps/web/package.json` | dependency `@calcom/clinic` | |
| `apps/web/next.config.ts` | `transpilePackages += "@calcom/clinic"` | TS source package |
| `turbo.json` | `globalEnv += "NEXT_PUBLIC_CLINIC_MODE"` | turbo strict env passthrough |

## Clinic-owned files (no conflict risk)

- `packages/clinic/**`
- `apps/web/modules/clinic/**`
- `CLINIC_PATCHES.md`

## Branding (env only, no code)

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS`, plus logos in
`apps/web/public/` (TODO: replace before the first clinic goes live, because Cal.com marks are trademarked).

## Known follow-ups

- `apps/web/modules/shell/Kbar.tsx` still lists Teams/Workflows in the command palette.
- The direct routes `/teams`, `/workflows`, `/routing` and `/insights` are still reachable by URL (they are gated by /ee
  licensing). Consider a redirect in clinic mode.

## Upgrading from upstream

```bash
git fetch upstream --tags
git merge vX.Y.Z          # conflicts should only appear in the files listed above
yarn install && TZ=UTC yarn test packages/clinic
```

## Windows dev setup gotchas

- **Path casing must match the real folder name on disk.** If the folder is `D:\AI` but you install from `D:\ai`,
  yarn creates `node_modules` junctions pointing at `D:\ai\...`. Turbopack then treats them as outside the project and every
  `@calcom/*` import fails with "Module not found" (all pages 500). Always `cd` into the exact on-disk casing
  (check with `Get-ChildItem D:\ -Directory`), and if links were created wrongly, remove them with `cmd /c rmdir` and re-run `yarn install`.
- **Use Turbopack (upstream's `yarn workspace @calcom/web dev`).** `next dev --webpack` fails on upstream's `node:path` import in `packages/i18n/next-i18next.config.js`.
- Do **not** replace `packages/prisma/.env` with a real copy as the README suggests: `.gitignore` un-ignores that path, so DB credentials could be committed.
- `NEXT_PUBLIC_*` flags must be read as a literal `process.env.NEXT_PUBLIC_X` for Next to inline them in client bundles (see `packages/clinic/src/config.ts`).
