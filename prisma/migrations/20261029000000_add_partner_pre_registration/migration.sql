-- CreatePartnerPreRegistration
-- Migration: 20261029000000_add_partner_pre_registration

-- Create the PartnerPreRegistration table
CREATE TABLE "PartnerPreRegistration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "responsibleTitle" TEXT,
    "vision" TEXT,
    "mission" TEXT,
    "description" TEXT,
    "interventionDomains" JSONB DEFAULT '[]'::jsonb,
    "legalDocuments" JSONB DEFAULT '[]'::jsonb,
    "finalizationCode" TEXT UNIQUE,
    "finalizationCodeUsed" BOOLEAN NOT NULL DEFAULT false,
    "finalizationCodeExpiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "PartnerPreRegistration_organizationId_idx" ON "PartnerPreRegistration"("organizationId");
CREATE INDEX "PartnerPreRegistration_email_idx" ON "PartnerPreRegistration"("email");
CREATE INDEX "PartnerPreRegistration_finalizationCode_idx" ON "PartnerPreRegistration"("finalizationCode");
CREATE INDEX "PartnerPreRegistration_status_idx" ON "PartnerPreRegistration"("status");
CREATE INDEX "PartnerPreRegistration_createdAt_idx" ON "PartnerPreRegistration"("createdAt");

-- Add foreign key to Organization
ALTER TABLE "PartnerPreRegistration" 
ADD CONSTRAINT "PartnerPreRegistration_organizationId_fkey" 
FOREIGN KEY ("organizationId") 
REFERENCES "Organization"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add relation to Organization model
-- This is a conceptual note - the relation is already defined in the Prisma schema
