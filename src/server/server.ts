import { serve } from "@hono/node-server";
import type { State } from "../state/state";
import { InputFile } from "grammy";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

export const startServer = (state: State) => {

  const adapter = new PrismaBetterSqlite3({
    url: "file:./prisma/dev.db"
  })
  const prisma = new PrismaClient({ adapter });
  state.setPrismaClient(prisma)

  const app = state.getHono();
  const bot = state.getBot();

  const tgID: string = process.env.USER_TELEGRAM_ID!;

  app.post("/api/send-message", async (c) => {
    try {
      const body = await c.req.json();
      if (!body.message) {
        return c.json({ error: "invalid json structure" }, 400);
      }
      await bot.api.sendMessage(tgID, body.message);
      return c.json({ success: true, delivered: true }, 200);
    } catch (error) {
      return c.json({ error: "Invalid json format" }, 400);
    }
  });

  app.post("/api/send-file", async (c) => {
    try {
      const body = await c.req.json();
      if (!body.file_path) {
        return c.json({ error: "invalid json structure" }, 400);
      }
      await bot.api.sendDocument(tgID, new InputFile(body.file_path));
      return c.json({ success: true, delivered: true }, 200);
    } catch (error) {
      return c.json({ error: "Invalid json format" }, 400);
    }
  });

  serve(
    {
      fetch: app.fetch,
      port: 3002,
    },
    (info) => {
      console.log("Hono is ready");
    },
  );
};
