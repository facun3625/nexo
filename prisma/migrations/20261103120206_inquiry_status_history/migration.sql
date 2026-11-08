-- CreateTable
CREATE TABLE "EstateInquiryStatusChange" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedById" TEXT,
    "changedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateInquiryStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstateInquiryStatusChange_inquiryId_createdAt_idx" ON "EstateInquiryStatusChange"("inquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "EstateInquiryStatusChange" ADD CONSTRAINT "EstateInquiryStatusChange_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "EstateInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
