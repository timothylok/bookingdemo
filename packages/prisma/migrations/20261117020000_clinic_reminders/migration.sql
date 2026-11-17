-- CreateEnum
CREATE TYPE "public"."ClinicReminderStatus" AS ENUM ('pending', 'sending', 'sent', 'cancelled', 'failed');

-- CreateTable
CREATE TABLE "public"."ClinicReminder" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."ClinicReminderStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicReminder_status_sendAt_idx" ON "public"."ClinicReminder"("status", "sendAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicReminder_bookingId_kind_key" ON "public"."ClinicReminder"("bookingId", "kind");

