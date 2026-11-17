import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// Regression guard: every clinic route must authorise before doing anything. New pages, actions or
// API routes added later fail this test until they use one of the approved guards.
const APP_DIR = join(__dirname, "../../../../apps/web/app");

const GUARDED_AREAS: { dir: string; guards: RegExp }[] = [
  { dir: "(use-page-wrapper)/(main-nav)/clinic", guards: /requireClinicRole\(/ },
  { dir: "(booking-page-wrapper)/intake", guards: /findIntakeFormByToken\(/ },
  { dir: "(booking-page-wrapper)/book", guards: /isClinicMode\(\)/ },
  { dir: "api/clinic/webhooks", guards: /verifyCalSignature\(/ },
  { dir: "api/clinic/cron", guards: /isAuthorised\(req\)/ },
];

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return /^(page\.tsx|actions\.ts|route\.ts)$/.test(entry) ? [path] : [];
  });
}

describe("clinic route guards", () => {
  for (const area of GUARDED_AREAS) {
    const files = routeFiles(join(APP_DIR, area.dir));

    it(`${area.dir} has route files`, () => {
      expect(files.length).toBeGreaterThan(0);
    });

    for (const file of files) {
      const name = relative(APP_DIR, file);
      const source = readFileSync(file, "utf8");

      it(`${name} uses an approved guard`, () => {
        expect(source).toMatch(area.guards);
      });

      if (name.endsWith("actions.ts")) {
        it(`${name}: every exported server action is guarded`, () => {
          const bodies = source.split(/export async function /).slice(1);
          for (const body of bodies) {
            const firstLines = body.split("\n").slice(0, 3).join("\n");
            expect(firstLines, `action ${body.split("(")[0]}`).toMatch(/requireClinicRole\(|isClinicMode\(\)/);
          }
        });
      }

      if (name.endsWith("route.ts")) {
        it(`${name} returns 404 outside clinic mode`, () => {
          expect(source).toMatch(/isClinicMode\(\)/);
        });
      }
    }
  }
});
