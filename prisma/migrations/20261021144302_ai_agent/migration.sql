-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('openai', 'gemini');

-- CreateTable
CREATE TABLE "EstateAiConversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "handledAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstateAiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateAiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "propertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateAiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstateAiConversation_tenantId_updatedAt_idx" ON "EstateAiConversation"("tenantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EstateAiConversation_tenantId_sessionId_key" ON "EstateAiConversation"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "EstateAiMessage_conversationId_createdAt_idx" ON "EstateAiMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "EstateAiConversation" ADD CONSTRAINT "EstateAiConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateAiMessage" ADD CONSTRAINT "EstateAiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "EstateAiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
