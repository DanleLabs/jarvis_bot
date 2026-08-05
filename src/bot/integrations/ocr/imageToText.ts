import type { State } from "../../../state/state";

export const imageToText = async (base64: string, state: State) => {

  let ocr: string

  const prisma = state.getPrisma()
  const openrouter = state.getOpenRouter();
  const preferences = await prisma.preferences.findFirstOrThrow({
    include: {
      activeAgent: true
    }
  })
  if (!preferences) throw new Error("preferences not found")
  const ocrPromptId = preferences.activeAgent.ocrPromptId
  if (!ocrPromptId) {
    ocr = state.getDefaultOcrPrompt()
  } else {
    const ocrPrompt = await prisma.prompt.findUnique({
      where: {
        id: ocrPromptId,
      }
    })
    if (!ocrPrompt) {
      ocr = state.getDefaultOcrPrompt()
    } else {
      ocr = ocrPrompt.prompt
    }
  }

  const response = await openrouter.chat.send({
    chatRequest: {
      model: process.env.OCR_MODEL!,
      provider: {
        only: ["alibaba"],
      },
      messages: [
        {
          role: "system",
          content: ocr,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              imageUrl: {
                url: base64,
              },
            },
          ],
        },
      ],
    },
  });

  console.log(response.choices[0]?.message.content);
  console.log(response);
  return (
    response.choices[0]?.message.content || "error while proccessing the image."
  );
};
