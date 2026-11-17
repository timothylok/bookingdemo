-- CreateTable
CREATE TABLE "public"."ClinicPatient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicPatient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicPatientBooking" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "bookingUid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicPatientBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicFormTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicFormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicPatientForm" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "responseJson" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicPatientForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPatient_email_key" ON "public"."ClinicPatient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPatientBooking_bookingId_key" ON "public"."ClinicPatientBooking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPatientBooking_bookingUid_key" ON "public"."ClinicPatientBooking"("bookingUid");

-- CreateIndex
CREATE INDEX "ClinicPatientBooking_patientId_idx" ON "public"."ClinicPatientBooking"("patientId");

-- CreateIndex
CREATE INDEX "ClinicPatientBooking_startTime_idx" ON "public"."ClinicPatientBooking"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPatientForm_bookingId_key" ON "public"."ClinicPatientForm"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPatientForm_tokenHash_key" ON "public"."ClinicPatientForm"("tokenHash");

-- CreateIndex
CREATE INDEX "ClinicPatientForm_patientId_idx" ON "public"."ClinicPatientForm"("patientId");

-- AddForeignKey
ALTER TABLE "public"."ClinicPatientBooking" ADD CONSTRAINT "ClinicPatientBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."ClinicPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicPatientForm" ADD CONSTRAINT "ClinicPatientForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."ClinicPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicPatientForm" ADD CONSTRAINT "ClinicPatientForm_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ClinicFormTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Default intake questionnaire (clinic-owned seed data)
INSERT INTO "public"."ClinicFormTemplate" ("name", "schemaJson", "isDefault", "active", "updatedAt")
VALUES (
  'Health questionnaire',
  '{"fields":[{"name":"reasonForVisit","label":"Reason for visit","type":"textarea","required":true},{"name":"currentMedications","label":"Current medications","type":"textarea","required":false},{"name":"allergies","label":"Allergies","type":"textarea","required":false},{"name":"previousTreatments","label":"Previous treatments for this condition","type":"textarea","required":false}]}'::jsonb,
  true,
  true,
  CURRENT_TIMESTAMP
);
