import type { State } from "../../../state/state";
import type { Part } from "../../types/parts.type";

export const sendMessage = async (
  state: State,
  parts: Part[],
) => {
  const prisma = state.getPrisma()
  const preferences = await prisma.preferences.findFirst()
  const agent = await prisma.agent.findUnique({
    where: {
      id: preferences?.activeAgentId
    },
    include: {
      systemPrompt: true,
      model: {
        include: {
          provider: true
        }
      }
    }
  })
  if (!agent || !preferences || !preferences.activeOpencodeId || !agent.model.referenceName || !agent.model.provider.referenceName) throw new Error("Not found")
  try {
    const response = await state.getOpencodeClient().session.prompt({
      path: { id: preferences?.activeOpencodeId },
      body: {
        model: { modelID: agent.model.referenceName, providerID: agent.model.provider.referenceName },
        system: agent?.systemPrompt.prompt || state.getDefaultSystemPrompt(),
        parts,
      },
    });
    return response;
  } catch (error) {
    state.getBot().api.sendMessage(state.getTelegramId(), "System: Opencode-Server Error");
  }
};
