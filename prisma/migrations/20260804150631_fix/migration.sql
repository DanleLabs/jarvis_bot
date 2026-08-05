-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "activeOpencodeId" TEXT,
    "activeAgentId" TEXT NOT NULL,
    CONSTRAINT "Preferences_activeAgentId_fkey" FOREIGN KEY ("activeAgentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Preferences" ("activeAgentId", "activeOpencodeId", "id", "telegramId") SELECT "activeAgentId", "activeOpencodeId", "id", "telegramId" FROM "Preferences";
DROP TABLE "Preferences";
ALTER TABLE "new_Preferences" RENAME TO "Preferences";
CREATE UNIQUE INDEX "Preferences_telegramId_key" ON "Preferences"("telegramId");
CREATE UNIQUE INDEX "Preferences_activeOpencodeId_key" ON "Preferences"("activeOpencodeId");
CREATE UNIQUE INDEX "Preferences_activeAgentId_key" ON "Preferences"("activeAgentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
