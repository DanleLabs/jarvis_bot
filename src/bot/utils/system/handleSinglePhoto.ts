import type { Context } from "grammy";
import type { State } from "../../../state/state";
import { mediaToBase64 } from "./mediaToBase64";
import { sendMessage } from "../agent/sendMessageToJarvis";
import { textPart } from "../agent/textPart";
import { filePart } from "../agent/filePart";
import { sendTgMessage } from "../telegram/sendTgMessage";
import { getText } from "../agent/extractTextFromResponse";

export async function handleSinglePhoto(
  ctx: Context,
  fileId: string,
  caption: string | undefined,
  state: State,
) {
  try {
    const userPrompt = caption || "";
    const dataUrl = await mediaToBase64(fileId, state.getBot());

    const response = await sendMessage(state, [
      textPart(userPrompt),
      filePart(dataUrl, "image/jpeg"),
    ]);

    await sendTgMessage(ctx, getText(response));
  } catch (error: any) {
    console.error("❌ Single photo failed:", error.message);
    await ctx.reply("Failed to process the image.");
  }
}
