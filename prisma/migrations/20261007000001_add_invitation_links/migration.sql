-- CreateTable
CREATE TABLE "InvitationLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'community',
    "targetId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "communityId" TEXT,
    "campaignId" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationLink_token_key" ON "InvitationLink"("token");

-- CreateIndex
CREATE INDEX "InvitationLink_token_idx" ON "InvitationLink"("token");

-- CreateIndex
CREATE INDEX "InvitationLink_organizationId_idx" ON "InvitationLink"("organizationId");

-- CreateIndex
CREATE INDEX "InvitationLink_communityId_idx" ON "InvitationLink"("communityId");

-- CreateIndex
CREATE INDEX "InvitationLink_campaignId_idx" ON "InvitationLink"("campaignId");

-- CreateIndex
CREATE INDEX "InvitationLink_status_idx" ON "InvitationLink"("status");

-- AddForeignKey
ALTER TABLE "InvitationLink" ADD CONSTRAINT "InvitationLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationLink" ADD CONSTRAINT "InvitationLink_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationLink" ADD CONSTRAINT "InvitationLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
