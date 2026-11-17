export function buildReminderEmail(input: {
  to: string;
  patientName: string;
  title: string;
  startTime: Date;
  location: string | null;
  clinicName: string;
  timeZone: string;
  manageLink: string;
}) {
  const when = new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: input.timeZone,
  }).format(input.startTime);

  return {
    to: input.to,
    subject: `Reminder: ${input.title} on ${when}`,
    text: [
      `Hi ${input.patientName},`,
      "",
      `This is a reminder of your appointment with ${input.clinicName}:`,
      "",
      `${input.title}`,
      when,
      ...(input.location ? [input.location] : []),
      "",
      `Need to change or cancel? ${input.manageLink}`,
    ].join("\n"),
  };
}

/** Same transport rules as the intake email: "log" records only the booking id, never patient data. */
export async function deliverReminderEmail(bookingId: number): Promise<void> {
  const transport = process.env.CLINIC_EMAIL_TRANSPORT ?? "log";
  if (transport === "log") {
    console.info(`[clinic] reminder email (not sent, log transport) for booking ${bookingId}`);
    return;
  }
  throw new Error(`Unknown CLINIC_EMAIL_TRANSPORT "${transport}" for reminder email`);
}
