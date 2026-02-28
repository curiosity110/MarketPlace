import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { askGPT } from "@/lib/openai";

export const runtime = "nodejs";

const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

const MAX_MESSAGES_COUNT = 12;
const MAX_MESSAGE_LENGTH = 1500;
const MAX_TOTAL_CHARS = 8000;

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const globalForAiRateLimit = globalThis as unknown as {
  aiChatRateLimit?: Map<string, RateLimitEntry>;
};
const aiChatRateLimit =
  globalForAiRateLimit.aiChatRateLimit ?? new Map<string, RateLimitEntry>();
if (process.env.NODE_ENV !== "production") {
  globalForAiRateLimit.aiChatRateLimit = aiChatRateLimit;
}

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]).optional(),
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

const chatPayloadSchema = z.object({
  question: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  systemContext: z.string().trim().max(MAX_MESSAGE_LENGTH).optional(),
  messages: z.array(messageSchema).max(MAX_MESSAGES_COUNT).optional(),
});

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const entry = aiChatRateLimit.get(key);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    aiChatRateLimit.set(key, { count: 1, windowStart: now });
    return { ok: true as const };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  entry.count += 1;
  aiChatRateLimit.set(key, entry);

  if (aiChatRateLimit.size > 2000) {
    for (const [entryKey, value] of aiChatRateLimit.entries()) {
      if (now - value.windowStart >= RATE_LIMIT_WINDOW_MS) {
        aiChatRateLimit.delete(entryKey);
      }
    }
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  const user = await requireUser();

  const ip = getClientIp(request);
  const rateKey = `${user.id}:${ip}`;
  const rateResult = enforceRateLimit(rateKey);
  if (!rateResult.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(rateResult.retryAfterSeconds) },
      },
    );
  }

  let payloadRaw: unknown;
  try {
    payloadRaw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsedPayload = chatPayloadSchema.safeParse(payloadRaw);
  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload.",
        issues: parsedPayload.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const payload = parsedPayload.data;
  const normalizedMessages = [
    ...(payload.systemContext ? [payload.systemContext] : []),
    payload.question,
    ...(payload.messages?.map((message) => message.content) ?? []),
  ];

  if (normalizedMessages.length > MAX_MESSAGES_COUNT) {
    return NextResponse.json(
      { error: `Too many messages (max ${MAX_MESSAGES_COUNT}).` },
      { status: 400 },
    );
  }

  const totalChars = normalizedMessages.reduce(
    (sum, message) => sum + message.length,
    0,
  );
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json(
      {
        error: `Payload is too large (max ${MAX_TOTAL_CHARS} total characters).`,
      },
      { status: 400 },
    );
  }

  try {
    const answer = await askGPT(
      payload.question.trim(),
      payload.systemContext,
    );

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI chat error:", error);

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 },
    );
  }
}
