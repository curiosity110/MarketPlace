"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIHelperProps {
  context?: string;
  placeholder?: string;
  title?: string;
  locale?: "en" | "mk";
}

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type QuickLink = {
  label: string;
  path: string;
};

function resolveQuickRoute(question: string): string | null {
  const q = question.toLowerCase();

  if (q.includes("register") || q.includes("signup") || q.includes("регист")) {
    return "/register";
  }
  if (q.includes("login") || q.includes("sign in") || q.includes("најав")) {
    return "/login";
  }
  if (q.includes("profile") || q.includes("профил")) {
    return "/profile";
  }
  if (q.includes("dashboard") || q.includes("контрол") || q.includes("seller")) {
    return "/dashboard";
  }
  if (q.includes("create") || q.includes("sell") || q.includes("post") || q.includes("објав")) {
    return "/dashboard?create=1";
  }
  if (q.includes("category") || q.includes("категор")) {
    return "/categories";
  }
  if (q.includes("browse") || q.includes("search") || q.includes("пребар")) {
    return "/browse";
  }

  return null;
}

function buildLocalRouteAnswer(question: string, locale: "en" | "mk", origin: string): string | null {
  const route = resolveQuickRoute(question);
  if (!route) return null;

  const fullUrl = origin ? `${origin}${route}` : route;
  if (locale === "mk") {
    return `Најбрз пат за ова е: ${fullUrl}`;
  }
  return `Fastest path for that is: ${fullUrl}`;
}

export function AIHelper({
  context = "You are a helpful marketplace assistant.",
  placeholder = "Ask anything...",
  title = "Marketplace Assistant",
  locale = "en",
}: AIHelperProps) {
  const isMk = locale === "mk";
  const text = isMk
    ? {
        openAssistant: "Отвори асистент за маркетплејс",
        askAssistant: "Прашај асистент",
        alwaysAvailable: "Секогаш достапен",
        closeAssistant: "Затвори асистент",
        loadingFallback: "Не можев да генерирам одговор.",
        unavailable: "Асистентот е привремено недостапен. Обиди се повторно за кратко.",
        initialHint: "Прашај за купување, продавање, цена или безбедност.",
        sendLabel: "Испрати",
        ariaInput: "Прашај го асистентот",
        quickQuestions: [
          "Како да напишам подобар наслов?",
          "Што да проверам пред да купам?",
          "Како да ја поставам цената?",
        ],
        quickLinksTitle: "Брзи линкови",
      }
    : {
        openAssistant: "Open marketplace assistant",
        askAssistant: "Ask assistant",
        alwaysAvailable: "Always available",
        closeAssistant: "Close assistant",
        loadingFallback: "I could not generate a reply.",
        unavailable: "Assistant is temporarily unavailable. Please try again in a moment.",
        initialHint: "Ask for help with buying, selling, pricing, or safety.",
        sendLabel: "Send",
        ariaInput: "Ask assistant",
        quickQuestions: [
          "Help me write a better title",
          "What should I ask before buying?",
          "How do I price this item?",
        ],
        quickLinksTitle: "Quick links",
      };

  const quickLinks = useMemo<QuickLink[]>(
    () =>
      isMk
        ? [
            { label: "Регистрација", path: "/register" },
            { label: "Најава", path: "/login" },
            { label: "Пребарување", path: "/browse" },
            { label: "Категории", path: "/categories" },
            { label: "Контролна табла", path: "/dashboard" },
          ]
        : [
            { label: "Register", path: "/register" },
            { label: "Login", path: "/login" },
            { label: "Browse", path: "/browse" },
            { label: "Categories", path: "/categories" },
            { label: "Dashboard", path: "/dashboard" },
          ],
    [isMk],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = input.trim().length > 0 && !loading;
  const initialHint = useMemo(() => text.initialHint, [text.initialHint]);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

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

    const localAnswer = buildLocalRouteAnswer(question, locale, baseUrl);
    if (localAnswer) {
      setMessages((prev) => [...prev, { role: "assistant", content: localAnswer }]);
      setLoading(false);
      return;
    }

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
          content: data.answer || data.error || text.loadingFallback,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: text.unavailable,
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
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-orange-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl md:bottom-6 md:right-6"
          aria-label={text.openAssistant}
        >
          <MessageCircle size={18} />
          <span>{text.askAssistant}</span>
        </button>
      )}

      {isOpen && (
        <section className="fixed bottom-20 right-3 z-50 flex h-[70vh] w-[calc(100vw-1.5rem)] max-w-[430px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl md:bottom-6 md:right-6 md:h-[560px]">
          <header className="flex items-center justify-between border-b border-border/80 bg-gradient-to-r from-orange-50 via-white to-blue-50 px-4 py-3 dark:from-orange-950/20 dark:via-card dark:to-blue-950/20">
            <div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs text-muted-foreground">{text.alwaysAvailable}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={text.closeAssistant}
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
                  {text.quickQuestions.map((question) => (
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
                <div className="space-y-2 rounded-xl border border-border/70 bg-card px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {text.quickLinksTitle}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickLinks.map((item) => {
                      const href = baseUrl ? `${baseUrl}${item.path}` : item.path;
                      return (
                        <a
                          key={item.path}
                          href={href}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
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
                id="assistant-question"
                name="assistantQuestion"
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
                aria-label={text.ariaInput}
                autoComplete="off"
              />
              <Button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                size="sm"
                className="h-10 px-3"
              >
                <Send size={14} />
                <span className="sr-only">{text.sendLabel}</span>
              </Button>
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
