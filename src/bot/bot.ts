import { Bot, Context, InlineKeyboard, type NextFunction } from "grammy";
import type { State } from "../state/state";
import { sendMessage } from "./utils/agent/sendMessageToJarvis";
import { mediaToBase64 } from "./utils/system/mediaToBase64";
import { filePart } from "./utils/agent/filePart";
import { textPart } from "./utils/agent/textPart";
import { getText } from "./utils/agent/extractTextFromResponse";
import { getTextFromAudio } from "./integrations/audio/textTranscription";
import { saveFile } from "./utils/system/saveDocument";
import { genAgentsKeyboard } from "./utils/telegram/genModelsKeyboard";
import { sendTgMessage } from "./utils/telegram/sendTgMessage";
import { handleSingleFile } from "./utils/system/handleSingleFile";
import { handleSinglePhoto } from "./utils/system/handleSinglePhoto";
import { genContextKeyboard } from "./utils/telegram/genContextKeyboard";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { contextKeyboard } from "./utils/telegram/contextKeyboard";

export const startBot = async (state: State): Promise<void> => {
  const bot = state.getBot();
  const prisma = state.getPrisma()
  const contextMenu = await contextKeyboard(state)

  async function saveContext(conversation: Conversation, ctx: Context) {
    await ctx.reply("Enter the name of the context 👉");
    const { message } = await conversation.waitFor("message:text");
    const preferences = await prisma.preferences.findFirst()
    if (!preferences?.activeOpencodeId) throw new Error("Context not found")
    await prisma.context.create({
      data: {
        openCodeId: preferences.activeOpencodeId,
        name: message.text
      }
    })
    await ctx.reply("Saved 👍")
  }

  bot.use(async (ctx: Context, next: NextFunction) => {
    if (String(ctx.from?.id) !== process.env.USER_TELEGRAM_ID) return;
    await next();
  });
  bot.use(async (ctx: Context, next: NextFunction) => {
    const activeContextId = (await prisma.preferences.findFirst())?.activeOpencodeId;
    if (!activeContextId) {
      try {
        const session = await opencode.session.create();
        if (!session?.data?.id) throw new Error("Could not create a session")
        await prisma.preferences.updateMany({
          data: {
            activeOpencodeId: session.data.id
          }
        })
      } catch (error) {
        ctx.reply("Error while creating the session");
        console.log("error while creating a session: " + error);
      }
    }
    bot.catch((err) => {
      const ctx = err.ctx;
      console.error(`Error while handling update ${ctx.update.update_id}:`);
      console.error(err.error);
    });
    await next();
  });
  bot.use(conversations());
  bot.use(createConversation(saveContext))
  bot.use(contextMenu)

  const opencode = state.getOpencodeClient();

  await bot.api.setMyCommands([
    { command: "new", description: "Start new chat" },
    { command: "context", description: "Change context"},
    { command: "agent", description: "Change agent" },
    { command: "save_context", description: "Save current context"},
  ]);

  bot.command("start", async (ctx: Context): Promise<void> => {
    await sendTgMessage(ctx, "System: You started agent successfully!");
  });
  bot.command("new", async (ctx: Context): Promise<void> => {
    try {
      const session = await opencode.session.create();
      if (!session?.data?.id) throw new Error("Could not create a session")
      await prisma.preferences.updateMany({
        data: {
          activeOpencodeId: session.data.id
        }
      })
      await ctx.reply("You started a new chat");
    } catch (err) {
      console.error("System: Command failed:", err);
      await ctx.reply("System: Command failed");
    }
  });
  bot.command("id", (ctx) => {
    ctx.reply(String(ctx.from?.id));
  });
  bot.command("agent", async (ctx) => {
    ctx.reply("Choose agent:", {
      reply_markup: await genAgentsKeyboard(state),
    });
  });
  bot.command("save_context", async (ctx) => {
    await ctx.conversation.enter("saveContext");
  });
  bot.command("context", async (ctx) => {
    await ctx.reply("Change the context:", {
      reply_markup: contextMenu
    })
  });

  bot.on("message:photo", async (ctx) => {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    if (!photo) return;

    const mediaGroupId = ctx.message.media_group_id;

    if (!mediaGroupId) {
      return handleSinglePhoto(ctx, photo.file_id, ctx.message.caption, state);
    }

    const cache = state.getPhotoCache();

    if (!cache.has(mediaGroupId)) {
      cache.set(mediaGroupId, { timer: null!, caption: null, fileIds: [] });
    }

    const bucket = cache.get(mediaGroupId)!;

    if (ctx.message.caption) {
      bucket.caption = ctx.message.caption;
    }

    bucket.fileIds.push(photo.file_id);

    clearTimeout(bucket.timer);

    bucket.timer = setTimeout(async () => {
      const { fileIds, caption } = bucket;
      cache.delete(mediaGroupId);

      try {
        const userPrompt =
          caption || "";

        const dataUrls = await Promise.all(
          fileIds.map((id) => mediaToBase64(id, bot)),
        );

        const response = await sendMessage(state, [
          textPart(userPrompt),
          ...dataUrls.map((url) => filePart(url, "image/jpeg")),
        ]);

        const text = getText(response);
        await sendTgMessage(ctx, text);
      } catch (error: any) {
        console.error("❌ Photo album pipeline failed:", error.message);
        await ctx.reply("System: Failed to process the uploaded image album.");
      }
    }, 600);
  });
  bot.on("message:voice", async (ctx) => {
    try {
      const text = await getTextFromAudio(
        ctx.message.voice.file_id,
        bot,
        state,
      );
      console.log(text);
      const response = await sendMessage(state, [textPart(text)]);
      const textAnswer = getText(response);
      await sendTgMessage(ctx, textAnswer);
    } catch (err) {
      ctx.reply("error occured.");
      console.log(err);
    }
  });
  bot.on("message:document", async (ctx) => {
    const document = ctx.message.document;
    if (!document) return;

    const mediaGroupId = ctx.message.media_group_id;

    if (!mediaGroupId) {
      return handleSingleFile(
        ctx,
        document.file_id,
        document.file_name,
        ctx.message.caption,
        state,
      );
    }

    const cache = state.getAlbumCache();

    if (!cache.has(mediaGroupId)) {
      cache.set(mediaGroupId, { timer: null!, caption: null, files: [] });
    }

    const bucket = cache.get(mediaGroupId)!;

    if (ctx.message.caption) {
      bucket.caption = ctx.message.caption;
    }

    bucket.files.push({
      id: document.file_id,
      name: document.file_name || `file_${document.file_id}`,
    });

    clearTimeout(bucket.timer);

    bucket.timer = setTimeout(async () => {
      const { files, caption } = bucket;
      cache.delete(mediaGroupId);

      try {
        const userPrompt = caption || "";
        const filePaths = await Promise.all(
          files.map((file) => saveFile(file.id, file.name, bot)),
        );

        const response = await sendMessage(state, [
          textPart(userPrompt),
          ...filePaths.map((path) => textPart(`USER SENT A FILE: ${path}`)),
        ]);

        const text = getText(response);
        await sendTgMessage(ctx, text);
      } catch (error: any) {
        console.error("❌ Album pipeline failed:", error.message);
        await ctx.reply("System: Failed to process the uploaded album.");
      }
    }, 600);
  });
  bot.on("message:text", async (ctx) => {
    const response = await sendMessage(state, [textPart(ctx.message.text)]);
    const text = getText(response);
    await sendTgMessage(ctx, text);
  });

  bot.callbackQuery(/^agent_(.+)$/, async (ctx) => {
    const selectedId = ctx.match[1];
    if (!selectedId) {
      await ctx.reply("System: No model is provided");
      return;
    }

    await prisma.preferences.update({
      where: {
        telegramId: state.getTelegramId()
      },
      data: {
        activeAgent: {
          connect: {
            id: selectedId
          }
        }
      }
    })

    await ctx.answerCallbackQuery({ text: "Done :)" });

    await ctx.deleteMessage();
  });
  bot.callbackQuery(/^context_(.+)$/, async (ctx) => {
    const selectedId = ctx.match[1];
    if (!selectedId) {
      await ctx.reply("System: No context is provided");
      return;
    }

    if (selectedId !== 'close') {
      const newContext = await prisma.context.findUnique({
        where: {
          id: selectedId
        }
      })
      if (!newContext) {
        ctx.reply("System: context not found")
        throw new Error("Context not found")
      }
      await prisma.preferences.update({
        where: {
          telegramId: state.getTelegramId()
        },
        data: {
          activeOpencodeId: newContext.openCodeId
        }
      })
    }

    await ctx.answerCallbackQuery({ text: "Done :)" });
    await ctx.deleteMessage();
  });

  bot.start();
};
