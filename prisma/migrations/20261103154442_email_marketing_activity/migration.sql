-- AlterTable
ALTER TABLE "EstateAuditEvent" ADD COLUMN     "actorName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "summary" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "EmailSubscriber" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'LIST',
    "status" TEXT NOT NULL DEFAULT 'SENDING',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdByName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "success" BOOLEAN,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailSubscriber_tenantId_unsubscribedAt_idx" ON "EmailSubscriber"("tenantId", "unsubscribedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSubscriber_tenantId_email_key" ON "EmailSubscriber"("tenantId", "email");

-- CreateIndex
CREATE INDEX "EmailCampaign_tenantId_createdAt_idx" ON "EmailCampaign"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_campaignId_idx" ON "EmailCampaignRecipient"("campaignId");

-- AddForeignKey
ALTER TABLE "EmailSubscriber" ADD CONSTRAINT "EmailSubscriber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
