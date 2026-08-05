import { Menu } from "@grammyjs/menu";
import type { State } from "../../../state/state";

export const contextKeyboard = async (state: State) => {
  const prisma = state.getPrisma()
  const contexts = await prisma.context.findMany()
  const preferences = await prisma.preferences.findFirst()

  const menu = new Menu("my-menu-identifier").dynamic(async (ctx, range) => {
    const contexts = await prisma.context.findMany()
    const preferences = await prisma.preferences.findFirst()

    if (!contexts[0]) {
      throw new Error("No context found")
    }

    for (const item of contexts) {
      const marker = preferences?.activeOpencodeId === item.openCodeId ? " ☑️" : "";
      range.text(item.name! + marker, async (ctx) => {
        await prisma.preferences.update({
          where: {
            telegramId: state.getTelegramId()
          },
          data: {
            activeOpencodeId: item.openCodeId
          }
        })
        ctx.menu.update()
      }).row()
    }
  })

  return menu
}
