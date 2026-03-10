"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-scroll-lock";

interface AIHelperProps {
  context?: string;
  placeholder?: string;
  title?: string;
  locale?: "en" | "mk";
  defaultOpen?: boolean;
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

  if (q.includes("home") || q.includes("landing") || q.includes("почет")) {
    return "/";
  }
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
    return "?create=1";
  }
  if (q.includes("category") || q.includes("категор")) {
    return "/categories";
  }
  if (q.includes("browse") || q.includes("search") || q.includes("пребар")) {
    return "/browse";
  }

  return null;
}

function buildLocalRouteAnswer(
  question: string,
  locale: "en" | "mk",
  origin: string,
  currentPath: string,
): string | null {
  const route = resolveQuickRoute(question);
  if (!route) return null;

  const resolvedRoute = route.startsWith("?")
    ? `${currentPath}${route}`
    : route;
  const fullUrl = origin ? `${origin}${resolvedRoute}` : resolvedRoute;
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
  defaultOpen = false,
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
            { label: "Почетна", path: "/" },
            { label: "Регистрација", path: "/register" },
            { label: "Најава", path: "/login" },
            { label: "Пребарување", path: "/browse" },
            { label: "Категории", path: "/categories" },
            { label: "Контролна табла", path: "/dashboard" },
          ]
        : [
            { label: "Home", path: "/" },
            { label: "Register", path: "/register" },
            { label: "Login", path: "/login" },
            { label: "Browse", path: "/browse" },
            { label: "Categories", path: "/categories" },
            { label: "Dashboard", path: "/dashboard" },
          ],
    [isMk],
  );

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = input.trim().length > 0 && !loading;
  const initialHint = useMemo(() => text.initialHint, [text.initialHint]);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  useEffect(() => {
    function openAssistant() {
      setIsOpen(true);
    }

    window.addEventListener("mkd:open-assistant", openAssistant);
    return () => {
      window.removeEventListener("mkd:open-assistant", openAssistant);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  async function sendMessage(message: string) {
    const question = message.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    const localAnswer = buildLocalRouteAnswer(
      question,
      locale,
      baseUrl,
      currentPath,
    );
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
          className="fixed right-3 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-[0_16px_32px_-24px_rgba(15,23,42,0.4)] backdrop-blur-md transition-colors hover:bg-muted sm:bottom-6 sm:left-auto sm:right-6 sm:z-40 sm:h-auto sm:w-auto sm:gap-2 sm:border-primary/30 sm:bg-gradient-to-r sm:from-orange-500 sm:to-blue-600 sm:px-4 sm:py-3 sm:text-sm sm:font-semibold sm:text-white sm:shadow-lg sm:hover:-translate-y-0.5 sm:hover:shadow-xl"
          style={{ bottom: "calc(var(--app-mobile-fab-offset) + env(safe-area-inset-bottom, 0px))" }}
          aria-label={text.openAssistant}
        >
          <MessageCircle size={17} />
          <span className="hidden md:inline">{text.askAssistant}</span>
        </button>
      )}

      {isOpen && (
        <section
          className="fixed inset-x-2.5 z-[55] flex h-[min(70dvh,34rem)] flex-col overflow-hidden rounded-[1.35rem] border border-border/65 bg-background/98 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.42)] backdrop-blur-sm sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:w-[calc(100vw-2rem)] sm:max-w-[430px] sm:rounded-2xl sm:border-border/80 sm:bg-background"
          style={{ bottom: "calc(var(--app-mobile-fab-offset) + env(safe-area-inset-bottom, 0px))" }}
        >
          <header className="flex items-center justify-between border-b border-border/55 bg-background/96 px-4 py-3">
            <div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="hidden text-xs text-muted-foreground sm:block">{text.alwaysAvailable}</p>
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

          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/12 p-3 sm:p-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="rounded-xl border border-dashed border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground">
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
                <div className="hidden space-y-2 rounded-xl border border-border/70 bg-card px-3 py-2 sm:block">
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

          <footer className="border-t border-border/75 bg-background p-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom,0px))]">
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
                className="min-h-11 px-3"
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
