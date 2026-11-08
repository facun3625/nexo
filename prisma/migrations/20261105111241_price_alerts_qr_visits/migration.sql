-- CreateTable
CREATE TABLE "EstatePriceAlert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "baselinePrice" DECIMAL(16,2) NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstatePriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateQrVisit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateQrVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstatePriceAlert_tenantId_createdAt_idx" ON "EstatePriceAlert"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EstatePriceAlert_propertyId_operation_email_key" ON "EstatePriceAlert"("propertyId", "operation", "email");

-- CreateIndex
CREATE INDEX "EstateQrVisit_tenantId_handledAt_idx" ON "EstateQrVisit"("tenantId", "handledAt");

-- CreateIndex
CREATE INDEX "EstateQrVisit_tenantId_createdAt_idx" ON "EstateQrVisit"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "EstateQrVisit_propertyId_idx" ON "EstateQrVisit"("propertyId");

-- AddForeignKey
ALTER TABLE "EstatePriceAlert" ADD CONSTRAINT "EstatePriceAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePriceAlert" ADD CONSTRAINT "EstatePriceAlert_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateQrVisit" ADD CONSTRAINT "EstateQrVisit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateQrVisit" ADD CONSTRAINT "EstateQrVisit_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
