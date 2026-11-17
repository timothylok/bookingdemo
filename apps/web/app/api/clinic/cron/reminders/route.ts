import { timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prismaReminderDeps } from "@calcom/clinic/src/reminders/prismaReminderDeps";
import { processDueReminders } from "@calcom/clinic/src/reminders/reminders";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; any other scheduler can do the same.
function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) return NextResponse.json({ message: "unauthorised" }, { status: 401 });
  const summary = await processDueReminders(new Date(), prismaReminderDeps);
  return NextResponse.json(summary);
}
