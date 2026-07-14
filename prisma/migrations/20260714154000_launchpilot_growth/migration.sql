CREATE TABLE "AutopilotConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "postsPerWeek" INTEGER NOT NULL DEFAULT 3,
  "reelsPerWeek" INTEGER NOT NULL DEFAULT 1,
  "storiesPerWeek" INTEGER NOT NULL DEFAULT 3,
  "dailyBudget" REAL NOT NULL DEFAULT 0,
  "platforms" TEXT NOT NULL DEFAULT 'facebook,instagram',
  "goal" TEXT NOT NULL DEFAULT 'sales',
  "lastRunAt" DATETIME,
  "nextRunAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "AutopilotConfig_shop_key" ON "AutopilotConfig"("shop");

CREATE TABLE "AdsCampaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "dailyBudget" REAL NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "productId" TEXT,
  "productTitle" TEXT,
  "headline" TEXT NOT NULL,
  "primaryText" TEXT NOT NULL,
  "destinationUrl" TEXT,
  "externalId" TEXT,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "spend" REAL NOT NULL DEFAULT 0,
  "revenue" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "AdsCampaign_shop_createdAt_idx" ON "AdsCampaign"("shop", "createdAt");

CREATE TABLE "MerchantPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shop" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "status" TEXT NOT NULL DEFAULT 'active',
  "trialEndsAt" DATETIME,
  "chargeId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "MerchantPlan_shop_key" ON "MerchantPlan"("shop");
