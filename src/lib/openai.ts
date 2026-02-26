import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

let openaiInstance: OpenAI | null = null;

function getOpenAIInstance(): OpenAI {
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please add it to your .env file.",
    );
  }

  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey });
  }

  return openaiInstance;
}

export const openai = new Proxy({} as OpenAI, {
  get: () => getOpenAIInstance(),
});

/**
 * Send a message to GPT-4 and get a response
 * @param prompt The user's question or prompt
 * @param systemContext Optional system message to set the AI's behavior
 * @returns The AI's response text
 */
export async function askGPT(
  prompt: string,
  systemContext = "You are a helpful marketplace assistant.",
) {
  const client = getOpenAIInstance();
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemContext },
      { role: "user", content: prompt.trim() },
    ],
    temperature: 0.4,
    max_tokens: 700,
  });

  return completion.choices[0]?.message?.content || "";
}

/**
 * Stream a response from GPT-4
 * Useful for long-form content or when you want to show real-time output
 */
export async function streamGPT(
  prompt: string,
  systemContext = "You are a helpful marketplace assistant.",
) {
  const client = getOpenAIInstance();
  return client.chat.completions.stream({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemContext },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });
}
