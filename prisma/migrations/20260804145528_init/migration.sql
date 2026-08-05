-- CreateTable
CREATE TABLE "Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "activeOpencodeId" TEXT NOT NULL,
    "activeAgentId" TEXT NOT NULL,
    CONSTRAINT "Preferences_activeAgentId_fkey" FOREIGN KEY ("activeAgentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Context" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openCodeId" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "referenceName" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    CONSTRAINT "AiModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "referenceName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "systemPromptId" TEXT NOT NULL,
    "ocrPromptId" TEXT,
    "modelId" TEXT NOT NULL,
    "imageSupport" BOOLEAN NOT NULL,
    CONSTRAINT "Agent_systemPromptId_fkey" FOREIGN KEY ("systemPromptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Agent_ocrPromptId_fkey" FOREIGN KEY ("ocrPromptId") REFERENCES "Prompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Agent_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AiModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "prompt" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_telegramId_key" ON "Preferences"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_activeOpencodeId_key" ON "Preferences"("activeOpencodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_activeAgentId_key" ON "Preferences"("activeAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "Context_openCodeId_key" ON "Context"("openCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_name_key" ON "Prompt"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_command_key" ON "Prompt"("command");
