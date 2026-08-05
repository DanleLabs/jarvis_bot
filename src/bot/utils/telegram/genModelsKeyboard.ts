import { InlineKeyboard } from "grammy";
import { State } from "../../../state/state";

export const genAgentsKeyboard = async (state: State) => {
  const inlineKeyboard = new InlineKeyboard();
  const prisma = state.getPrisma()
  const agents = await prisma.agent.findMany()
  const preferences = await prisma.preferences.findFirst()

  for (const item of agents) {
    const marker = preferences?.activeAgentId === item.id ? " ☑️" : "";
    inlineKeyboard.text(item.name + marker, `agent_${item.id}`).row();
  }

  inlineKeyboard.text("Close", "agent_close");

  return inlineKeyboard;
};
