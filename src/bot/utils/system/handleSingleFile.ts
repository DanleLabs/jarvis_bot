import type { State } from "../../../state/state";
import { getText } from "../agent/extractTextFromResponse";
import { sendMessage } from "../agent/sendMessageToJarvis";
import { textPart } from "../agent/textPart";
import { sendTgMessage } from "../telegram/sendTgMessage";
import { saveFile } from "./saveDocument";

export const handleSingleFile = async (
  ctx: any,
  fileId: string,
  fileName: string | undefined,
  caption: string | undefined,
  state: State,
) => {
  try {
    const userPrompt = caption || "";
    const filePath = await saveFile(fileId, fileName || "file", state.getBot());

    const response = await sendMessage(state, [
      textPart(userPrompt),
      textPart(`USER SENT A FILE: ${filePath}`),
    ]);
    await sendTgMessage(ctx, getText(response));
  } catch (error: any) {
    console.error("❌ Single document failed:", error.message);
    await ctx.reply("Failed to process the document.");
  }
};
