CREATE TABLE "MetaConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "facebookPageId" TEXT,
    "facebookPageName" TEXT,
    "pageAccessToken" TEXT,
    "userAccessToken" TEXT,
    "instagramAccountId" TEXT,
    "instagramUsername" TEXT,
    "instagramName" TEXT,
    "instagramProfilePicture" TEXT,
    "tokenExpiresAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "MetaConnection_shop_key" ON "MetaConnection"("shop");
