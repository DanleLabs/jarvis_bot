import "dotenv/config"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

interface AgentData {
  name: string;
  imageSupport: boolean;
  model: { displayName: string; referenceName: string };
  provider: { displayName: string; referenceName: string };
}

const AGENTS: AgentData[] = [
  {
    name: "Luna",
    imageSupport: true,
    model: { displayName: "Gpt-Luna", referenceName: "@preset/luna" },
    provider: { displayName: "Open-Router", referenceName: "custom" },
  },
  {
    name: "Deepy",
    imageSupport: true,
    model: {
      displayName: "DeepSeek v4 flash",
      referenceName: "deepseek-v4-flash-free",
    },
    provider: { displayName: "OpenCode", referenceName: "opencode" },
  },
];

const DEFAULT_TELEGRAM_ID = process.env.USER_TELEGRAM_ID!;

async function main() {
  let defaultAgentId: string | null = null;

  for (const data of AGENTS) {
    const provider = await prisma.provider.upsert({
      where: { id: `provider-${data.provider.referenceName}` },
      update: {
        displayName: data.provider.displayName,
        referenceName: data.provider.referenceName,
      },
      create: {
        id: `provider-${data.provider.referenceName}`,
        displayName: data.provider.displayName,
        referenceName: data.provider.referenceName,
      },
    });

    const model = await prisma.aiModel.upsert({
      where: { id: `model-${data.model.referenceName}` },
      update: {
        displayName: data.model.displayName,
        referenceName: data.model.referenceName,
        providerId: provider.id,
      },
      create: {
        id: `model-${data.model.referenceName}`,
        displayName: data.model.displayName,
        referenceName: data.model.referenceName,
        providerId: provider.id,
      },
    });

    const prompt = await prisma.prompt.upsert({
      where: { name: `system-${data.name}` },
      update: {},
      create: {
        name: `system-${data.name}`,
        command: `system-${data.name}`,
        prompt: "You are a useful ai-assistant",
      },
    });

    const agent = await prisma.agent.upsert({
      where: { name: data.name },
      update: {
        imageSupport: data.imageSupport,
        modelId: model.id,
        systemPromptId: prompt.id,
      },
      create: {
        name: data.name,
        imageSupport: data.imageSupport,
        modelId: model.id,
        systemPromptId: prompt.id,
      },
    });

    if (!defaultAgentId) {
      defaultAgentId = agent.id;
    }
  }

  if (defaultAgentId) {
    await prisma.preferences.upsert({
      where: { telegramId: DEFAULT_TELEGRAM_ID },
      update: {
        activeAgentId: defaultAgentId,
      },
      create: {
        telegramId: DEFAULT_TELEGRAM_ID,
        activeAgentId: defaultAgentId,
        activeOpencodeId: null,
      },
    });

    console.log(`Preferences seeded for telegramId: ${DEFAULT_TELEGRAM_ID} with agent ID: ${defaultAgentId}`);
  }
}

main()
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
