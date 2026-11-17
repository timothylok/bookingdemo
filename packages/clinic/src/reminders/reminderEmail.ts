import type { ClinicEmail } from "../email/sendClinicEmail";
import { sendClinicEmail } from "../email/sendClinicEmail";

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

/** The log transport records only the booking id, never patient data. */
export async function deliverReminderEmail(email: ClinicEmail, bookingId: number): Promise<void> {
  await sendClinicEmail(email, {
    logLine: `reminder for booking ${bookingId}`,
    idempotencyKey: `clinic-reminder-${bookingId}`,
  });
}
