-- AlterTable
ALTER TABLE "EstateDevelopment" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "EstateDevelopmentCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstateDevelopmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstateDevelopmentCategory_tenantId_idx" ON "EstateDevelopmentCategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateDevelopmentCategory_tenantId_name_key" ON "EstateDevelopmentCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EstateDevelopment_categoryId_idx" ON "EstateDevelopment"("categoryId");

-- AddForeignKey
ALTER TABLE "EstateDevelopment" ADD CONSTRAINT "EstateDevelopment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EstateDevelopmentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDevelopmentCategory" ADD CONSTRAINT "EstateDevelopmentCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
