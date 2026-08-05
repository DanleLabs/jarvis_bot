import { InlineKeyboard } from "grammy";
import { State } from "../../../state/state";

export const genContextKeyboard = async (state: State) => {
  const inlineKeyboard = new InlineKeyboard();
  const prisma = state.getPrisma()
  const contexts = await prisma.context.findMany()
  const preferences = await prisma.preferences.findFirst()

  for (const item of contexts) {
    const marker = preferences?.activeOpencodeId === item.openCodeId ? " ☑️" : "";
    inlineKeyboard.text(item.name + marker, `context_${item.id}`).row();
  }

  inlineKeyboard.text("Close", "context_close");

  return inlineKeyboard;
};
