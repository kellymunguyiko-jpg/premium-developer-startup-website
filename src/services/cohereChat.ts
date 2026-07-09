import {
  chatWithCohere,
  getDevSpaceGreetingReply,
  isCohereConfigured,
  type ChatTurn,
} from "./cohere";

export { isCohereConfigured };
export type { ChatTurn };

/** General-purpose DevSpace AI chat (sidebar AI Assistant page) */
export async function chatGeneralAI(options: {
  prompt: string;
  history?: ChatTurn[];
}): Promise<{ text: string; code?: string; language?: string }> {
  const { prompt, history = [] } = options;

  const greeting = getDevSpaceGreetingReply(prompt);
  if (greeting) {
    return { text: greeting };
  }

  // Reuse Cohere service with virtual chat context (triggers general system prompt)
  const result = await chatWithCohere({
    prompt,
    fileName: "ai-assistant-chat.md",
    language: "markdown",
    code: "",
    history: history.filter((m) => m.role === "user" || m.role === "assistant"),
  });

  return {
    text: result.text,
    code: result.code,
    language: result.language,
  };
}
