import dayjs from "@calcom/dayjs";

export type ReceptionViewMode = "day" | "week";

export type DateRange = { start: Date; end: Date; days: string[] };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Day boundaries are the clinic's local midnights, not UTC, so "today" matches the reception desk. */
export function getReceptionRange(
  view: ReceptionViewMode,
  date: string | undefined,
  timeZone: string,
  now: Date
): DateRange {
  const anchor =
    date && DATE_KEY.test(date) && dayjs.tz(date, timeZone).isValid()
      ? dayjs.tz(date, timeZone)
      : dayjs(now).tz(timeZone);
  // Weeks run Monday-Sunday, as clinic rosters usually do.
  const start = view === "week" ? anchor.startOf("day").subtract((anchor.day() + 6) % 7, "day") : anchor.startOf("day");
  const length = view === "week" ? 7 : 1;
  const days = Array.from({ length }, (_, i) => start.add(i, "day").format("YYYY-MM-DD"));
  return { start: start.toDate(), end: start.add(length, "day").toDate(), days };
}

export function dayKey(date: Date, timeZone: string): string {
  return dayjs(date).tz(timeZone).format("YYYY-MM-DD");
}

export type IntakeStatus = "submitted" | "pending" | "none";

export type AppointmentInput = {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  status: string;
  userId: number | null;
  attendees: { name: string; email: string; noShow: boolean | null }[];
};

export type ReceptionRow = {
  bookingId: number;
  day: string;
  startTime: Date;
  endTime: Date;
  title: string;
  status: string;
  practitionerId: number | null;
  patientName: string;
  noShow: boolean;
  intake: IntakeStatus;
};

export function buildReceptionRows(
  bookings: AppointmentInput[],
  intakeByBookingId: Map<number, { submittedAt: Date | null }>,
  timeZone: string
): ReceptionRow[] {
  return bookings
    .map((booking) => {
      const form = intakeByBookingId.get(booking.id);
      const patient = booking.attendees[0];
      return {
        bookingId: booking.id,
        day: dayKey(booking.startTime, timeZone),
        startTime: booking.startTime,
        endTime: booking.endTime,
        title: booking.title,
        status: booking.status,
        practitionerId: booking.userId,
        patientName: patient?.name || patient?.email || "",
        noShow: booking.attendees.some((a) => a.noShow === true),
        intake: (form ? (form.submittedAt ? "submitted" : "pending") : "none") as IntakeStatus,
      };
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

const ACTIVE_STATUSES = new Set(["ACCEPTED", "PENDING", "AWAITING_HOST"]);

export function summarizeReception(rows: ReceptionRow[], today: string, tomorrow: string) {
  const active = rows.filter((row) => ACTIVE_STATUSES.has(row.status));
  return {
    today: active.filter((row) => row.day === today).length,
    tomorrow: active.filter((row) => row.day === tomorrow).length,
    cancelled: rows.filter((row) => row.status === "CANCELLED" || row.status === "REJECTED").length,
    noShows: rows.filter((row) => row.noShow).length,
    intakePending: active.filter((row) => row.intake === "pending").length,
  };
}
