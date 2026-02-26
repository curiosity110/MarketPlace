import { NextResponse } from "next/server";
import { askGPT } from "@/lib/openai";

export const runtime = "nodejs";
const MAX_QUESTION_LENGTH = 1500;

export async function POST(request: Request) {
  try {
    const { question, systemContext } = await request.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        {
          error: "Invalid request: 'question' is required and must be a string",
        },
        { status: 400 },
      );
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question is too long (max ${MAX_QUESTION_LENGTH} characters).` },
        { status: 400 },
      );
    }

    const answer = await askGPT(
      question.trim(),
      typeof systemContext === "string" ? systemContext : undefined,
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
