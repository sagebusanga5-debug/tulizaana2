-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "demoExpiresAt" TIMESTAMP(3),
ADD COLUMN     "demoStartedAt" TIMESTAMP(3),
ADD COLUMN     "demoUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "communitiesMax" INTEGER NOT NULL,
    "membersMax" INTEGER NOT NULL,
    "campaignsPerMonth" INTEGER NOT NULL,
    "reportLevel" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentStatus" TEXT,
    "quotaCommunitiesMax" INTEGER NOT NULL,
    "quotaMembersMax" INTEGER NOT NULL,
    "quotaCampaignsPerMonth" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "Plan_active_code_idx" ON "Plan"("active", "code");

-- CreateIndex
CREATE INDEX "SubscriptionSnapshot_organizationId_createdAt_idx" ON "SubscriptionSnapshot"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Organization_planId_idx" ON "Organization"("planId");

-- CreateIndex
CREATE INDEX "Organization_demoUsed_idx" ON "Organization"("demoUsed");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionSnapshot" ADD CONSTRAINT "SubscriptionSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

