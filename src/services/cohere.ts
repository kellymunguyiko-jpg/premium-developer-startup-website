import { CohereClientV2 } from "cohere-ai";

const apiKey = import.meta.env.VITE_COHERE_API_KEY as string | undefined;
const model =
  (import.meta.env.VITE_COHERE_MODEL as string | undefined) ||
  "command-a-plus-05-2026";

export type ChatTurn = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ParsedAIResult = {
  text: string;
  code?: string;
  language?: string;
  shouldWriteToFile: boolean;
};

let client: CohereClientV2 | null = null;

function getClient(): CohereClientV2 {
  if (!apiKey) {
    throw new Error(
      "Missing VITE_COHERE_API_KEY. Add it to your .env file and restart the app."
    );
  }
  if (!client) {
    client = new CohereClientV2({ token: apiKey });
  }
  return client;
}

export function isCohereConfigured(): boolean {
  return Boolean(apiKey && apiKey.length > 10);
}

/** Friendly identity reply for greetings like "how are you" */
export function getDevSpaceGreetingReply(prompt: string): string | null {
  const t = prompt.trim().toLowerCase();
  if (!t) return null;

  const isGreeting =
    /^(hi|hello|hey|yo|salut|bonjour|muraho|bite|amakuru)\b/.test(t) ||
    /how are you/.test(t) ||
    /how r u/.test(t) ||
    /how's it going/.test(t) ||
    /who are you/.test(t) ||
    /what(?:'s| is) your name/.test(t) ||
    /uri gute/.test(t) ||
    /amakuru yawe/.test(t) ||
    /umeze ute/.test(t);

  if (!isGreeting) return null;

  const kinyarwanda = /muraho|bite|amakuru|uri gute|umeze ute/.test(t);
  if (kinyarwanda) {
    return `Meze neza! 👋 Ndi **DevSpace AI**.

Ndi umufasha wawe muri DevSpace Pro — nkugufasha:
- Gukora no gusobanura code
- Gukosora errors
- Ideas za projects
- Kwiga programming

Mbaze icyo ushaka gukora uyu munsi?`;
  }

  return `I'm doing great — thanks for asking! 👋

I'm **DevSpace AI**. I help you with coding, debugging, project ideas, and learning on DevSpace Pro.

How can I help you today?`;
}

function buildSystemPrompt(
  fileName: string,
  language: string,
  code: string
): string {
  const isGeneralChat = fileName === "ai-assistant-chat.md";

  const identity = `Your name is DevSpace AI (also called DevAI).
When users greet you or ask "how are you", "who are you", or similar, reply warmly and say you are DevSpace AI and you help them with coding, debugging, projects, and learning on DevSpace Pro.
Example: "I'm doing great! I'm DevSpace AI — I help you write code, fix bugs, and build projects. How can I help you today?"`;

  if (isGeneralChat) {
    return `You are DevSpace AI, the AI Assistant for DevSpace Pro.

${identity}

You help developers with coding, debugging, architecture, learning paths, and project ideas.

Rules:
1. Be practical, clear, and friendly.
2. When sharing code, always use fenced code blocks with a language tag.
3. Use short sections and bullet points when helpful.
4. Reply in the user's language (English or Kinyarwanda).
5. Prefer complete, runnable examples over pseudo-code.
6. Never refuse normal coding help.
7. Always identify as DevSpace AI when asked who you are or how you are.`;
  }

  const snippet =
    code.length > 12000 ? `${code.slice(0, 12000)}\n\n// ...truncated` : code;

  return `You are DevSpace AI, an expert pair-programming assistant inside DevSpace Pro Online IDE.

${identity}

Context:
- Active file: ${fileName}
- Language: ${language}
- User can insert/replace code in the editor from your replies.

Current file content:
\`\`\`${language}
${snippet || "// empty file"}
\`\`\`

Rules:
1. Be practical, clear, and concise.
2. When the user asks you to write, generate, fix, improve, refactor, create, or code something, ALWAYS include the full updated code in a fenced code block.
3. Prefer one main fenced code block with the complete file (or complete function) ready to paste.
4. Use this format when providing code:

Brief explanation of what you did.

\`\`\`${language}
// full code here
\`\`\`

5. If the user only wants explanation (no code changes), do not invent a full rewrite unless useful.
6. Match the language of the active file unless the user asks for another language.
7. You may reply in the user's language (English or Kinyarwanda) when they write in that language.
8. Never refuse normal coding help. Focus on helping the user ship working code.
9. When returning code for the open file, return COMPLETE runnable code, not partial snippets with placeholders.
10. If the user greets you or asks how you are, introduce yourself as DevSpace AI and offer to help.`;
}

/** Extract first fenced code block from model text */
export function extractCodeBlock(
  text: string,
  fallbackLanguage = "javascript"
): { code?: string; language?: string; explanation: string } {
  const fence = /```([a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)```/;
  const match = text.match(fence);

  if (!match) {
    return { explanation: text.trim() };
  }

  const language = match[1]?.trim() || fallbackLanguage;
  const code = match[2].replace(/\n$/, "");
  const explanation = text
    .replace(match[0], "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { code, language, explanation: explanation || "Here's the code:" };
}

function wantsCodeWrite(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const writeHints = [
    "write",
    "generate",
    "create",
    "build",
    "make",
    "fix",
    "improve",
    "refactor",
    "update",
    "implement",
    "add",
    "code",
    "kora",
    "andika",
    "hindura",
    "replace",
    "rewrite",
    "complete",
    "solve",
    "debug",
    "convert",
    "full file",
    "fenced code",
  ];
  return writeHints.some((h) => lower.includes(h));
}

function extractTextFromResponse(response: unknown): string {
  const res = response as {
    message?: {
      content?: Array<{ type?: string; text?: string }> | string;
      text?: string;
    };
    text?: string;
  };

  const content = res?.message?.content;
  if (Array.isArray(content)) {
    const joined = content
      .filter((part) => part && (part.type === "text" || part.text))
      .map((part) => part.text || "")
      .join("")
      .trim();
    if (joined) return joined;
  }
  if (typeof content === "string" && content.trim()) return content.trim();
  if (res?.message?.text) return res.message.text;
  if (res?.text) return res.text;
  return "";
}

export async function chatWithCohere(options: {
  prompt: string;
  fileName: string;
  language: string;
  code: string;
  history?: ChatTurn[];
}): Promise<ParsedAIResult> {
  const { prompt, fileName, language, code, history = [] } = options;

  // Instant identity reply for greetings
  const greeting = getDevSpaceGreetingReply(prompt);
  if (greeting) {
    return {
      text: greeting,
      shouldWriteToFile: false,
    };
  }

  const cohere = getClient();

  const messages = [
    {
      role: "system" as const,
      content: buildSystemPrompt(fileName, language, code),
    },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    {
      role: "user" as const,
      content: prompt,
    },
  ];

  const response = await cohere.chat({
    model,
    messages,
  });

  const text = extractTextFromResponse(response);

  if (!text) {
    throw new Error("Empty response from Cohere");
  }

  const parsed = extractCodeBlock(text, language);
  const shouldWriteToFile = Boolean(parsed.code) && wantsCodeWrite(prompt);

  return {
    text: parsed.explanation || text,
    code: parsed.code,
    language: parsed.language || language,
    shouldWriteToFile,
  };
}
