import { createOpencodeClient } from "@opencode-ai/sdk";
import { startBot } from "./src/bot/bot";
import { State } from "./src/state/state";
import { startServer } from "./src/server/server";
import { Bot, Context } from "grammy";
import { Hono } from "hono";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./src/generated/prisma/client";
import { OpenRouter } from "@openrouter/sdk";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import type { ConversationFlavor } from "@grammyjs/conversations";

const app = () => {

  const adapter = new PrismaLibSql({
    url: "file:./prisma/dev.db",
  });

  const opencode = createOpencodeClient({
    baseUrl: process.env.OPEN_CODE_BASE_URL!,
  });
  const bot = new Bot<ConversationFlavor<Context>>(process.env.TELEGRAM_BOT_API_KEY!)
  const hono = new Hono()
  const prisma = new PrismaClient({ adapter })
  const openRouter = new OpenRouter()

  const state = new State({
    bot,
    opencode,
    hono,
    prisma,
    openRouter
  });

  startBot(state);
  startServer(state);
};

app();
