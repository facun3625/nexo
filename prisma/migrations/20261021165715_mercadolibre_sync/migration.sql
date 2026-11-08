-- AlterTable
ALTER TABLE "EstateListing" ADD COLUMN     "mlCategoryId" TEXT,
ADD COLUMN     "mlItemId" TEXT,
ADD COLUMN     "mlLastError" TEXT,
ADD COLUMN     "mlLastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "mlListingTypeId" TEXT DEFAULT 'silver',
ADD COLUMN     "mlPermalink" TEXT,
ADD COLUMN     "mlStatus" TEXT;

-- CreateTable
CREATE TABLE "EstateMlLocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL DEFAULT '',
    "mlNeighborhoodId" TEXT,
    "mlCityId" TEXT NOT NULL,
    "mlCityName" TEXT NOT NULL,
    "mlStateId" TEXT NOT NULL,
    "mlStateName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateMlLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstateMlLocation_tenantId_city_neighborhood_key" ON "EstateMlLocation"("tenantId", "city", "neighborhood");

-- CreateIndex
CREATE INDEX "EstateListing_mlItemId_idx" ON "EstateListing"("mlItemId");

-- AddForeignKey
ALTER TABLE "EstateMlLocation" ADD CONSTRAINT "EstateMlLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
