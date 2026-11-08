-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGENT', 'CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ServiceFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'DATE', 'SELECT');

-- CreateEnum
CREATE TYPE "ServiceInquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUOTED', 'RESPONDED', 'ACCEPTED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AboutMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "RateLimitAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("tenantId","key")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutMedia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "AboutMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AboutMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateContact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "birthDate" TIMESTAMP(3),
    "occupation" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ownerPortalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstateContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateAgent" (
    "userId" TEXT,
    "accessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateDevelopment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "developer" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT 'PROJECT',
    "progress" INTEGER,
    "estimatedDelivery" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionColumns" BOOLEAN NOT NULL DEFAULT false,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "financing" TEXT NOT NULL DEFAULT '',
    "videoUrl" TEXT,
    "formTitle" TEXT NOT NULL DEFAULT 'Consultá por este emprendimiento',
    "submitLabel" TEXT NOT NULL DEFAULT 'Enviar consulta',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstateDevelopment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateDevelopmentField" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "ServiceFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstateDevelopmentField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateDevelopmentImage" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstateDevelopmentImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateDevelopmentInquiry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "developmentId" TEXT,
    "developmentName" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "status" "ServiceInquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "telegramSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "notificationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstateDevelopmentInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateDevelopmentInquiryEvent" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "status" "ServiceInquiryStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateDevelopmentInquiryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateProperty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "videoUrl" TEXT,
    "orientation" TEXT,
    "petsPolicy" TEXT,
    "creditEligible" BOOLEAN,
    "floorPlanUrl" TEXT,
    "propertyType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL DEFAULT '',
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "garages" INTEGER NOT NULL DEFAULT 0,
    "coveredArea" DECIMAL(12,2),
    "totalArea" DECIMAL(12,2),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT,
    "developmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstateProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstatePageView" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT,
    "path" TEXT NOT NULL,
    "visitorId" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstatePageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstatePropertyFavorite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstatePropertyFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateListing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "price" DECIMAL(16,2),
    "temporary" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" TEXT,
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "EstateListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstatePropertyType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstatePropertyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateCity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstateCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateNeighborhood" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstateNeighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateContractType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstateContractType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstatePropertyDestination" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstatePropertyDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateMedia" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstateMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateInquiry" (
    "assignedAgentId" TEXT,
    "searchCriteria" JSONB,
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "propertyId" TEXT,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ADMIN',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstateInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateVisit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "EstateVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateContract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contractType" TEXT,
    "propertyDestination" TEXT,
    "dueDay" INTEGER,
    "graceDays" INTEGER,
    "firstChargePeriod" TEXT,
    "paymentMethod" TEXT,
    "collectedBy" TEXT,
    "lateFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lateFeeType" TEXT,
    "lateFeeValue" DECIMAL(16,2),
    "lateFeeFromDay" INTEGER,
    "lateFeeFrequency" TEXT,
    "lateFeeCap" DECIMAL(16,2),
    "updateType" TEXT NOT NULL DEFAULT 'NONE',
    "updateFrequency" TEXT,
    "firstUpdateAt" TIMESTAMP(3),
    "updatePercent" DECIMAL(6,2),
    "updateRounding" TEXT,
    "adjustmentNotes" TEXT NOT NULL DEFAULT '',
    "hasDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(16,2),
    "depositCurrency" TEXT,
    "depositInstallments" INTEGER,
    "depositStatus" TEXT,
    "depositHeldBy" TEXT,
    "guaranteeType" TEXT,
    "guaranteeExpiresAt" TIMESTAMP(3),
    "tenantAcceptedHandoverAt" TIMESTAMP(3),
    "ownerAcceptedHandoverAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateContractDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'AGENCY_ONLY',
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateContractHandoverPhoto" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateContractHandoverPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateContractGuarantor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateContractGuarantor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateContractChargeConcept" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastAmount" DECIMAL(16,2),
    "lastCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateContractChargeConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateRentIndexValue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "percent" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "EstateRentIndexValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateBillingSuggestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateBillingSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateBuilding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateBuilding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateUnit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "coefficient" DECIMAL(9,6) NOT NULL,
    "responsibleName" TEXT NOT NULL,

    CONSTRAINT "EstateUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateCharge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT,
    "unitId" TEXT,
    "concept" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateReceipt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateMaintenance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "supplier" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateDeal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'NEGOTIATION',
    "amount" DECIMAL(16,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "agentName" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstateDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateValuation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "amount" DECIMAL(16,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateValuation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_contactId_key" ON "User"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_tenantId_provider_providerAccountId_key" ON "Account"("tenantId", "provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "RateLimitAttempt_key_createdAt_idx" ON "RateLimitAttempt"("key", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_tenantId_createdAt_idx" ON "EmailLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappLog_tenantId_createdAt_idx" ON "WhatsappLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappLog_userId_createdAt_idx" ON "WhatsappLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AboutMedia_tenantId_idx" ON "AboutMedia"("tenantId");

-- CreateIndex
CREATE INDEX "EstateContact_tenantId_name_idx" ON "EstateContact"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EstateContact_id_tenantId_key" ON "EstateContact"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateAgent_userId_key" ON "EstateAgent"("userId");

-- CreateIndex
CREATE INDEX "EstateAgent_tenantId_name_idx" ON "EstateAgent"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EstateAgent_id_tenantId_key" ON "EstateAgent"("id", "tenantId");

-- CreateIndex
CREATE INDEX "EstateDevelopment_tenantId_published_createdAt_idx" ON "EstateDevelopment"("tenantId", "published", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EstateDevelopment_id_tenantId_key" ON "EstateDevelopment"("id", "tenantId");

-- CreateIndex
CREATE INDEX "EstateDevelopmentField_developmentId_order_idx" ON "EstateDevelopmentField"("developmentId", "order");

-- CreateIndex
CREATE INDEX "EstateDevelopmentImage_developmentId_order_idx" ON "EstateDevelopmentImage"("developmentId", "order");

-- CreateIndex
CREATE INDEX "EstateDevelopmentInquiry_tenantId_status_createdAt_idx" ON "EstateDevelopmentInquiry"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EstateDevelopmentInquiry_developmentId_idx" ON "EstateDevelopmentInquiry"("developmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateDevelopmentInquiry_id_tenantId_key" ON "EstateDevelopmentInquiry"("id", "tenantId");

-- CreateIndex
CREATE INDEX "EstateDevelopmentInquiryEvent_inquiryId_createdAt_idx" ON "EstateDevelopmentInquiryEvent"("inquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "EstateProperty_tenantId_published_city_idx" ON "EstateProperty"("tenantId", "published", "city");

-- CreateIndex
CREATE UNIQUE INDEX "EstateProperty_id_tenantId_key" ON "EstateProperty"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateProperty_tenantId_code_key" ON "EstateProperty"("tenantId", "code");

-- CreateIndex
CREATE INDEX "EstatePageView_tenantId_createdAt_idx" ON "EstatePageView"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "EstatePageView_tenantId_propertyId_createdAt_idx" ON "EstatePageView"("tenantId", "propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "EstatePageView_tenantId_path_createdAt_idx" ON "EstatePageView"("tenantId", "path", "createdAt");

-- CreateIndex
CREATE INDEX "EstatePropertyFavorite_tenantId_userId_idx" ON "EstatePropertyFavorite"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EstatePropertyFavorite_userId_propertyId_key" ON "EstatePropertyFavorite"("userId", "propertyId");

-- CreateIndex
CREATE INDEX "EstateListing_tenantId_status_idx" ON "EstateListing"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EstateListing_propertyId_operation_key" ON "EstateListing"("propertyId", "operation");

-- CreateIndex
CREATE INDEX "EstatePropertyType_tenantId_idx" ON "EstatePropertyType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstatePropertyType_tenantId_name_key" ON "EstatePropertyType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EstateCity_tenantId_idx" ON "EstateCity"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateCity_tenantId_name_key" ON "EstateCity"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EstateNeighborhood_tenantId_idx" ON "EstateNeighborhood"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateNeighborhood_tenantId_name_key" ON "EstateNeighborhood"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EstateContractType_tenantId_idx" ON "EstateContractType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateContractType_tenantId_name_key" ON "EstateContractType"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EstatePropertyDestination_tenantId_idx" ON "EstatePropertyDestination"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstatePropertyDestination_tenantId_name_key" ON "EstatePropertyDestination"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EstateMedia_tenantId_propertyId_idx" ON "EstateMedia"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "EstateInquiry_tenantId_assignedAgentId_idx" ON "EstateInquiry"("tenantId", "assignedAgentId");

-- CreateIndex
CREATE INDEX "EstateInquiry_tenantId_status_createdAt_idx" ON "EstateInquiry"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EstateVisit_tenantId_startsAt_idx" ON "EstateVisit"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "EstateContract_tenantId_endsAt_idx" ON "EstateContract"("tenantId", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "EstateContract_id_tenantId_key" ON "EstateContract"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateContract_tenantId_reference_key" ON "EstateContract"("tenantId", "reference");

-- CreateIndex
CREATE INDEX "EstateContractDocument_tenantId_contractId_idx" ON "EstateContractDocument"("tenantId", "contractId");

-- CreateIndex
CREATE INDEX "EstateContractHandoverPhoto_tenantId_contractId_idx" ON "EstateContractHandoverPhoto"("tenantId", "contractId");

-- CreateIndex
CREATE INDEX "EstateContractGuarantor_tenantId_contractId_idx" ON "EstateContractGuarantor"("tenantId", "contractId");

-- CreateIndex
CREATE INDEX "EstateContractGuarantor_tenantId_contactId_idx" ON "EstateContractGuarantor"("tenantId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateContractGuarantor_contractId_contactId_key" ON "EstateContractGuarantor"("contractId", "contactId");

-- CreateIndex
CREATE INDEX "EstateContractChargeConcept_tenantId_contractId_idx" ON "EstateContractChargeConcept"("tenantId", "contractId");

-- CreateIndex
CREATE INDEX "EstateRentIndexValue_tenantId_index_idx" ON "EstateRentIndexValue"("tenantId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "EstateRentIndexValue_tenantId_index_period_key" ON "EstateRentIndexValue"("tenantId", "index", "period");

-- CreateIndex
CREATE INDEX "EstateBillingSuggestion_tenantId_idx" ON "EstateBillingSuggestion"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateBillingSuggestion_contractId_kind_period_key" ON "EstateBillingSuggestion"("contractId", "kind", "period");

-- CreateIndex
CREATE UNIQUE INDEX "EstateBuilding_id_tenantId_key" ON "EstateBuilding"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateUnit_id_tenantId_key" ON "EstateUnit"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateUnit_buildingId_label_key" ON "EstateUnit"("buildingId", "label");

-- CreateIndex
CREATE INDEX "EstateCharge_tenantId_dueAt_idx" ON "EstateCharge"("tenantId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "EstateCharge_id_tenantId_key" ON "EstateCharge"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateCharge_contractId_period_concept_key" ON "EstateCharge"("contractId", "period", "concept");

-- CreateIndex
CREATE UNIQUE INDEX "EstateCharge_unitId_period_concept_key" ON "EstateCharge"("unitId", "period", "concept");

-- CreateIndex
CREATE UNIQUE INDEX "EstateReceipt_idempotencyKey_key" ON "EstateReceipt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EstateReceipt_tenantId_chargeId_idx" ON "EstateReceipt"("tenantId", "chargeId");

-- CreateIndex
CREATE INDEX "EstateMaintenance_tenantId_status_idx" ON "EstateMaintenance"("tenantId", "status");

-- CreateIndex
CREATE INDEX "EstateAuditEvent_tenantId_createdAt_idx" ON "EstateAuditEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "EstateDeal_tenantId_stage_idx" ON "EstateDeal"("tenantId", "stage");

-- CreateIndex
CREATE INDEX "EstateValuation_tenantId_status_idx" ON "EstateValuation"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "EstateContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappLog" ADD CONSTRAINT "WhatsappLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappLog" ADD CONSTRAINT "WhatsappLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AboutMedia" ADD CONSTRAINT "AboutMedia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContact" ADD CONSTRAINT "EstateContact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateAgent" ADD CONSTRAINT "EstateAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateAgent" ADD CONSTRAINT "EstateAgent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDevelopment" ADD CONSTRAINT "EstateDevelopment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDevelopmentField" ADD CONSTRAINT "EstateDevelopmentField_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "EstateDevelopment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDevelopmentImage" ADD CONSTRAINT "EstateDevelopmentImage_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "EstateDevelopment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDevelopmentInquiry" ADD CONSTRAINT "EstateDevelopmentInquiry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDevelopmentInquiry" ADD CONSTRAINT "EstateDevelopmentInquiry_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "EstateDevelopment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDevelopmentInquiryEvent" ADD CONSTRAINT "EstateDevelopmentInquiryEvent_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "EstateDevelopmentInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateProperty" ADD CONSTRAINT "EstateProperty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateProperty" ADD CONSTRAINT "EstateProperty_ownerId_tenantId_fkey" FOREIGN KEY ("ownerId", "tenantId") REFERENCES "EstateContact"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateProperty" ADD CONSTRAINT "EstateProperty_developmentId_tenantId_fkey" FOREIGN KEY ("developmentId", "tenantId") REFERENCES "EstateDevelopment"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePageView" ADD CONSTRAINT "EstatePageView_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePageView" ADD CONSTRAINT "EstatePageView_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePropertyFavorite" ADD CONSTRAINT "EstatePropertyFavorite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePropertyFavorite" ADD CONSTRAINT "EstatePropertyFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePropertyFavorite" ADD CONSTRAINT "EstatePropertyFavorite_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateListing" ADD CONSTRAINT "EstateListing_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePropertyType" ADD CONSTRAINT "EstatePropertyType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateCity" ADD CONSTRAINT "EstateCity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateNeighborhood" ADD CONSTRAINT "EstateNeighborhood_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractType" ADD CONSTRAINT "EstateContractType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstatePropertyDestination" ADD CONSTRAINT "EstatePropertyDestination_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateMedia" ADD CONSTRAINT "EstateMedia_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateInquiry" ADD CONSTRAINT "EstateInquiry_assignedAgentId_tenantId_fkey" FOREIGN KEY ("assignedAgentId", "tenantId") REFERENCES "EstateAgent"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateInquiry" ADD CONSTRAINT "EstateInquiry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateInquiry" ADD CONSTRAINT "EstateInquiry_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "EstateContact"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateInquiry" ADD CONSTRAINT "EstateInquiry_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateVisit" ADD CONSTRAINT "EstateVisit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateVisit" ADD CONSTRAINT "EstateVisit_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateVisit" ADD CONSTRAINT "EstateVisit_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "EstateContact"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContract" ADD CONSTRAINT "EstateContract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContract" ADD CONSTRAINT "EstateContract_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContract" ADD CONSTRAINT "EstateContract_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "EstateContact"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractDocument" ADD CONSTRAINT "EstateContractDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractDocument" ADD CONSTRAINT "EstateContractDocument_contractId_tenantId_fkey" FOREIGN KEY ("contractId", "tenantId") REFERENCES "EstateContract"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractHandoverPhoto" ADD CONSTRAINT "EstateContractHandoverPhoto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractHandoverPhoto" ADD CONSTRAINT "EstateContractHandoverPhoto_contractId_tenantId_fkey" FOREIGN KEY ("contractId", "tenantId") REFERENCES "EstateContract"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractGuarantor" ADD CONSTRAINT "EstateContractGuarantor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractGuarantor" ADD CONSTRAINT "EstateContractGuarantor_contractId_tenantId_fkey" FOREIGN KEY ("contractId", "tenantId") REFERENCES "EstateContract"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractGuarantor" ADD CONSTRAINT "EstateContractGuarantor_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "EstateContact"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractChargeConcept" ADD CONSTRAINT "EstateContractChargeConcept_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateContractChargeConcept" ADD CONSTRAINT "EstateContractChargeConcept_contractId_tenantId_fkey" FOREIGN KEY ("contractId", "tenantId") REFERENCES "EstateContract"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateRentIndexValue" ADD CONSTRAINT "EstateRentIndexValue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateBillingSuggestion" ADD CONSTRAINT "EstateBillingSuggestion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateBillingSuggestion" ADD CONSTRAINT "EstateBillingSuggestion_contractId_tenantId_fkey" FOREIGN KEY ("contractId", "tenantId") REFERENCES "EstateContract"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateBuilding" ADD CONSTRAINT "EstateBuilding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateUnit" ADD CONSTRAINT "EstateUnit_buildingId_tenantId_fkey" FOREIGN KEY ("buildingId", "tenantId") REFERENCES "EstateBuilding"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateCharge" ADD CONSTRAINT "EstateCharge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateCharge" ADD CONSTRAINT "EstateCharge_contractId_tenantId_fkey" FOREIGN KEY ("contractId", "tenantId") REFERENCES "EstateContract"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateCharge" ADD CONSTRAINT "EstateCharge_unitId_tenantId_fkey" FOREIGN KEY ("unitId", "tenantId") REFERENCES "EstateUnit"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateReceipt" ADD CONSTRAINT "EstateReceipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateReceipt" ADD CONSTRAINT "EstateReceipt_chargeId_tenantId_fkey" FOREIGN KEY ("chargeId", "tenantId") REFERENCES "EstateCharge"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateMaintenance" ADD CONSTRAINT "EstateMaintenance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateMaintenance" ADD CONSTRAINT "EstateMaintenance_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateAuditEvent" ADD CONSTRAINT "EstateAuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDeal" ADD CONSTRAINT "EstateDeal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDeal" ADD CONSTRAINT "EstateDeal_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "EstateProperty"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateDeal" ADD CONSTRAINT "EstateDeal_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "EstateContact"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateValuation" ADD CONSTRAINT "EstateValuation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateValuation" ADD CONSTRAINT "EstateValuation_contactId_tenantId_fkey" FOREIGN KEY ("contactId", "tenantId") REFERENCES "EstateContact"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
