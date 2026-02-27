"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIHelperProps {
  context?: string;
  placeholder?: string;
  title?: string;
}

const quickQuestions = [
  "Help me write a better title",
  "What should I ask before buying?",
  "How do I price this item?",
];

export function AIHelper({
  context = "You are a helpful marketplace assistant.",
  placeholder = "Ask anything...",
  title = "Marketplace Assistant",
}: AIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = input.trim().length > 0 && !loading;

  const initialHint = useMemo(
    () => `Ask for help with buying, selling, pricing, or safety.`,
    [],
  );

  useEffect(() => {
    function openAssistant() {
      setIsOpen(true);
    }

    window.addEventListener("mkd:open-assistant", openAssistant);
    return () => {
      window.removeEventListener("mkd:open-assistant", openAssistant);
    };
  }, []);

  async function sendMessage(message: string) {
    const question = message.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, systemContext: context }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.error || "I could not generate a reply.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Assistant is temporarily unavailable. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-orange-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl md:bottom-6 md:right-6"
          aria-label="Open GPT marketplace assistant"
        >
          <MessageCircle size={18} />
          <span>Ask GPT</span>
        </button>
      )}

      {isOpen && (
        <section className="fixed bottom-20 right-3 z-50 flex h-[70vh] w-[calc(100vw-1.5rem)] max-w-[430px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl md:bottom-6 md:right-6 md:h-[560px]">
          <header className="flex items-center justify-between border-b border-border/80 bg-gradient-to-r from-orange-50 via-white to-blue-50 px-4 py-3 dark:from-orange-950/20 dark:via-card dark:to-blue-950/20">
            <div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs text-muted-foreground">Always available</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close assistant"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="rounded-xl border border-dashed border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  {initialHint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendMessage(question)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border/70 bg-card"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 size={15} className="animate-spin" />
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-border/80 bg-background p-3">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (canSend) {
                      sendMessage(input);
                    }
                  }
                }}
                placeholder={placeholder}
                disabled={loading}
                aria-label="Ask GPT assistant"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                size="sm"
                className="h-10 px-3"
              >
                <Send size={14} />
              </Button>
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
