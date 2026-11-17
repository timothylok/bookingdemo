import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { handleBookingEvent } from "@calcom/clinic/src/webhooks/handleBookingEvent";
import { parseBookingEvent } from "@calcom/clinic/src/webhooks/parseBookingEvent";
import { prismaBookingEventDeps } from "@calcom/clinic/src/webhooks/prismaBookingEventDeps";
import { verifyCalSignature } from "@calcom/clinic/src/webhooks/verifySignature";

export async function POST(req: NextRequest) {
  // The signature covers the exact bytes Cal.com sent, so read the raw text before parsing.
  const rawBody = await req.text();
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
