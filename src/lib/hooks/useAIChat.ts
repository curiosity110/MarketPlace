"use client";

import { useState } from "react";

interface UseAIChatOptions {
  systemContext?: string;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          systemContext: options.systemContext,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response from AI");
      }

      const data = await response.json();
      return data.answer;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { ask, loading, error };
}
