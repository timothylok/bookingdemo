export type IntakeEmail = { to: string; subject: string; text: string };

export function buildIntakeEmail(input: {
  to: string;
  patientName: string;
  link: string;
  startTime: Date;
  clinicName: string;
  timeZone: string;
}): IntakeEmail {
  const when = new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: input.timeZone,
  }).format(input.startTime);

  return {
    to: input.to,
    subject: `Before your appointment on ${when}`,
    text: [
      `Hi ${input.patientName},`,
      "",
      `Thanks for booking with ${input.clinicName}. Please complete a short health questionnaire before your appointment on ${when}:`,
      "",
      input.link,
      "",
      "The link is personal to you and stops working 24 hours after your appointment.",
    ].join("\n"),
  };
}

/**
 * Transport is chosen by CLINIC_EMAIL_TRANSPORT. Only "log" exists so far: it records that an email
 * would be sent (link only, never the patient's name or answers). A real SMTP transport must be added
 * before going live.
 */
export async function deliverIntakeEmail(email: IntakeEmail, link: string): Promise<void> {
  const transport = process.env.CLINIC_EMAIL_TRANSPORT ?? "log";
  if (transport === "log") {
    console.info(`[clinic] intake email (not sent, log transport): ${link}`);
    return;
  }
  throw new Error(`Unknown CLINIC_EMAIL_TRANSPORT "${transport}" for intake email`);
}
