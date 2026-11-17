-- CreateEnum
CREATE TYPE "public"."ClinicDeliveryType" AS ENUM ('clinic', 'video', 'phone');

-- CreateEnum
CREATE TYPE "public"."ClinicRole" AS ENUM ('admin', 'reception', 'practitioner');

-- CreateTable
CREATE TABLE "public"."ClinicLocation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "kind" "public"."ClinicDeliveryType" NOT NULL DEFAULT 'clinic',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicService" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NZD',
    "description" TEXT,
    "color" TEXT,
    "deliveryType" "public"."ClinicDeliveryType" NOT NULL DEFAULT 'clinic',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicServiceAssignment" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "practitionerUserId" INTEGER NOT NULL,
    "eventTypeId" INTEGER,
    "locationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicStaffRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "public"."ClinicRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicStaffRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicServiceAssignment_practitionerUserId_idx" ON "public"."ClinicServiceAssignment"("practitionerUserId");

-- CreateIndex
CREATE INDEX "ClinicServiceAssignment_eventTypeId_idx" ON "public"."ClinicServiceAssignment"("eventTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicServiceAssignment_serviceId_practitionerUserId_locati_key" ON "public"."ClinicServiceAssignment"("serviceId", "practitionerUserId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicStaffRole_userId_key" ON "public"."ClinicStaffRole"("userId");

-- AddForeignKey
ALTER TABLE "public"."ClinicServiceAssignment" ADD CONSTRAINT "ClinicServiceAssignment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."ClinicService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicServiceAssignment" ADD CONSTRAINT "ClinicServiceAssignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."ClinicLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

