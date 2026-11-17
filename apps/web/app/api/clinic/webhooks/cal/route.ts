import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isClinicMode } from "@calcom/clinic/src/config";
import { handleBookingEvent } from "@calcom/clinic/src/webhooks/handleBookingEvent";
import { parseBookingEvent } from "@calcom/clinic/src/webhooks/parseBookingEvent";
import { prismaBookingEventDeps } from "@calcom/clinic/src/webhooks/prismaBookingEventDeps";
import { verifyCalSignature } from "@calcom/clinic/src/webhooks/verifySignature";

// Booking payloads are a few KB; anything far larger is not from Cal.com and is rejected unread.
const MAX_BODY_BYTES = 256 * 1024;

export async function POST(req: NextRequest) {
  if (!isClinicMode()) return NextResponse.json({ message: "not found" }, { status: 404 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "payload too large" }, { status: 413 });
  }

  // The signature covers the exact bytes Cal.com sent, so read the raw text before parsing.
  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) return NextResponse.json({ message: "payload too large" }, { status: 413 });
  if (!verifyCalSignature(rawBody, req.headers.get("x-cal-signature-256"), process.env.CLINIC_WEBHOOK_SECRET)) {
    return NextResponse.json({ message: "invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }

  const outcome = parseBookingEvent(body);
  if (outcome.kind === "ignored") return NextResponse.json({ status: "ignored" });
  if (outcome.kind === "invalid") {
    return NextResponse.json({ message: `invalid payload at ${outcome.reason}` }, { status: 400 });
  }

  const result = await handleBookingEvent(outcome.event, prismaBookingEventDeps);
  return NextResponse.json({ status: "ok", ...result });
}
