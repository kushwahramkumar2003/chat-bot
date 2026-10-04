"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CHAT_API_URL, listConversations, type Conversation } from "../../services/api";

type Message = { role: "user" | "assistant"; content: string };

const starters = [
  {
    icon: "✳",
    title: "Get inspired",
    prompt: "Give me three creative ideas for a weekend project.",
  },
  {
    icon: "⌘",
    title: "Write something",
    prompt: "Help me write a clear, friendly project update.",
  },
  {
    icon: "⌁",
    title: "Learn something",
    prompt: "Explain how large language models work in simple terms.",
  },
  {
    icon: "◇",
    title: "Make a plan",
    prompt: "Help me plan a productive week, one step at a time.",
  },
];

const iconButton =
  "grid size-10 shrink-0 place-items-center rounded-lg text-[#55544e] transition-colors hover:bg-[#eae8e1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b]";
const navItem =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-[13px] text-[#62615a] transition-colors hover:bg-[#eae8e1] hover:text-[#26251f] focus-visible:outline-2 focus-visible:outline-[#9a694b]";
const keycap =
  "rounded border border-[#e7e4dc] bg-[#faf9f5] px-1.5 py-0.5 font-sans text-[10px] text-[#77746c]";

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [error, setError] = useState("");
  const [conversationError, setConversationError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async (selectId?: string | null) => {
    setIsLoadingConversations(true);
    setConversationError("");
    try {
      const items = await listConversations();
      setConversations(items);
      if (selectId) {
        const selected = items.find((item) => item.id === selectId);
        if (selected) {
          setSelectedConversationId(selected.id);
          setMessages(selected.messages.map(({ role, content }) => ({ role, content })));
        }
      }
    } catch (loadError) {
      setConversationError(
        loadError instanceof Error ? loadError.message : "Couldn’t load conversations."
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  function selectConversation(conversation: Conversation) {
    if (isSending) return;
    setSelectedConversationId(conversation.id);
    setMessages(conversation.messages.map(({ role, content }) => ({ role, content })));
    setError("");
    setSidebarOpen(false);
  }

  async function sendMessage(event?: FormEvent, text = input) {
    event?.preventDefault();
    const content = text.trim();
    if (!content || isSending) return;
    setInput("");
    setError("");
    setIsSending(true);
    setMessages((current) => [
      ...current,
      { role: "user", content },
      { role: "assistant", content: "" },
    ]);
    const conversationIdForRequest = selectedConversationId;

    try {
      const response = await fetch(`${CHAT_API_URL}/text`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          ...(conversationIdForRequest
            ? { conversationId: conversationIdForRequest }
            : {}),
        }),
      });
      if (!response.ok || !response.body) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          typeof body === "object" && body !== null && "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "The assistant couldn’t respond. Please try again.";
        throw new Error(message);
      }
      const responseConversationId =
        response.headers.get("X-Conversation-Id") ?? conversationIdForRequest;
      if (responseConversationId) {
        setSelectedConversationId(responseConversationId);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "assistant")
            next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
      await loadConversations(responseConversationId);
    } catch (sendError) {
      setMessages((current) =>
        current.at(-1)?.content === "" ? current.slice(0, -1) : current
      );
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Couldn’t reach the assistant. Check that the chat API is running, then try again."
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    if (isSending) return;
    setSelectedConversationId(null);
    setMessages([]);
    setError("");
    setInput("");
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-[#fffefa] font-sans text-[#26251f]">
      <aside
        aria-label="Chat navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] shrink-0 flex-col border-r border-[#e9e7e1] bg-[#f5f4ef] px-3.5 pb-3 pt-[22px] transition-transform duration-200 md:static md:z-auto md:w-[264px] md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="mb-7 flex items-center gap-2.5 px-2.5">
          <span
            aria-hidden="true"
            className="text-[23px] leading-none text-[#b97550]"
          >
            ✳
          </span>
          <span className="text-[17px] font-semibold tracking-[-.04em]">
            Morrow
          </span>
          <button
            aria-label="Close navigation"
            className={`ml-auto text-xl md:hidden ${iconButton}`}
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <button
          disabled={isSending}
          className="flex h-[42px] items-center gap-2 rounded-lg border border-[#dedbd2] bg-[#fffefa] px-3 text-left text-[13px] font-medium hover:border-[#cfc9bc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b]"
          onClick={startNewChat}
        >
          <span aria-hidden="true" className="text-lg">
            ＋
          </span>{" "}
          New chat <kbd className={`ml-auto ${keycap}`}>⌘ K</kbd>
        </button>
        <div className="mt-[30px]">
          <p className="mb-2 ml-2.5 text-[10px] font-semibold uppercase tracking-[.1em] text-[#89877f]">
            Workspace
          </p>
          <button
            className={`${navItem} bg-[#eae8e1] font-medium text-[#26251f]`}
          >
            <span aria-hidden="true" className="text-base">
              ◷
            </span>{" "}
            Chats
          </button>
          <button className={navItem}>
            <span aria-hidden="true" className="text-base">
              ⌕
            </span>{" "}
            Explore
          </button>
        </div>
        <div className="mt-7">
          <p className="mb-2 ml-2.5 text-[10px] font-semibold uppercase tracking-[.1em] text-[#89877f]">
            Recent
          </p>
          <div className="max-h-[45vh] space-y-1 overflow-y-auto">
            {isLoadingConversations && (
              <p className="px-2.5 py-2 text-xs text-[#77766f]" aria-live="polite">Loading conversations…</p>
            )}
            {conversationError && (
              <div className="px-2.5 py-2 text-xs text-[#754b3b]" role="alert">
                <p>{conversationError}</p>
                <button className="mt-1 underline" onClick={() => void loadConversations()}>Try again</button>
              </div>
            )}
            {!isLoadingConversations && !conversationError && conversations.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-[#77766f]">No conversations yet</p>
            )}
            {conversations.map((conversation) => {
              const title = conversation.title || conversation.messages.find((item) => item.role === "user")?.content || "New conversation";
              return (
                <button
                  className={`block min-h-10 w-full truncate rounded-lg px-2.5 py-2.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-[#9a694b] disabled:cursor-wait ${selectedConversationId === conversation.id ? "bg-[#eae8e1] font-medium text-[#26251f]" : "text-[#68675f] hover:bg-[#eae8e1] hover:text-[#26251f]"}`}
                  disabled={isSending}
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  title={title}
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-auto">
          <button className={navItem}>
            <span aria-hidden="true" className="text-base">
              ⚙
            </span>{" "}
            Settings
          </button>
          <div className="mt-2 flex items-center gap-2.5 border-t border-[#e4e2db] px-2 py-3">
            <span className="grid size-[31px] place-items-center rounded-full bg-[#7c8374] font-serif text-sm text-white">
              R
            </span>
            <span className="grid gap-0.5 text-[11px]">
              <strong className="font-semibold">Riley Morgan</strong>
              <small className="text-[10px] text-[#77766f]">Free plan</small>
            </span>
            <span aria-hidden="true" className="ml-auto text-xl text-[#77766f]">
              ···
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 border-0 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#f0eee9] px-3 md:h-[62px] md:px-7">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              className={`grid md:hidden ${iconButton}`}
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <span className="inline-flex items-center gap-2 text-sm font-semibold md:hidden">
              <span className="text-lg text-[#b97550]">✳</span> Morrow
            </span>
            <button className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold hover:bg-[#f5f4ef] focus-visible:outline-2 focus-visible:outline-[#9a694b] md:flex">
              Morrow{" "}
              <span className="rounded border border-[#ebe8df] px-1.5 py-0.5 text-[9px] font-medium text-[#827f74]">
                Preview
              </span>
              <span aria-hidden="true" className="text-base text-[#88867e]">
                ⌄
              </span>
            </button>
          </div>
          <button
            className="flex min-h-9 items-center gap-2 rounded-lg border border-[#e9e7e1] px-3 text-xs hover:bg-[#f5f4ef] focus-visible:outline-2 focus-visible:outline-[#9a694b]"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            <span aria-hidden="true" className="text-sm">
              ↗
            </span>{" "}
            Share
          </button>
        </header>

        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          aria-live="polite"
          aria-busy={isSending}
        >
          {messages.length === 0 ? (
            <div className="m-auto w-[min(100%_-_32px,660px)] py-9 text-center">
              <div
                aria-hidden="true"
                className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl border border-[#eee4dc] bg-[#faf5ef] text-2xl text-[#b97550]"
              >
                ✳
              </div>
              <p className="mb-2.5 text-[11px] uppercase tracking-[.11em] text-[#8a8178]">
                A little space to think
              </p>
              <h1 className="font-serif text-[clamp(32px,4vw,43px)] font-normal tracking-[-.045em]">
                What’s on your mind?
              </h1>
              <p className="mx-auto mb-8 mt-3 max-w-[430px] text-[13px] leading-relaxed text-[#77766f] md:text-sm">
                Ask a question, explore an idea, or get a hand with whatever
                you’re working on.
              </p>
              <div className="grid grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
                {starters.map((starter) => (
                  <button
                    className="group flex min-h-[70px] items-center gap-3 rounded-lg border border-[#e9e7e1] bg-white px-3.5 py-3 text-left transition-colors hover:border-[#cfc9bc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b]"
                    key={starter.title}
                    onClick={() => {
                      setInput(starter.prompt);
                      inputRef.current?.focus();
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f6eee7] text-sm text-[#9a694b]"
                    >
                      {starter.icon}
                    </span>
                    <span className="grid min-w-0 gap-1">
                      <strong className="text-xs font-semibold">
                        {starter.title}
                      </strong>
                      <small className="truncate text-[11px] text-[#88867f]">
                        {starter.prompt}
                      </small>
                    </span>
                    <span
                      aria-hidden="true"
                      className="ml-auto text-sm text-[#aaa69e] opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-[min(100%_-_24px,700px)] py-10 md:w-[min(100%_-_40px,700px)]">
              {messages.map((message, index) => (
                <article
                  className={`mb-7 flex gap-3 ${message.role === "user" ? "justify-end" : "items-start"}`}
                  key={`${index}-${message.role}`}
                >
                  {message.role === "assistant" && (
                    <span
                      aria-hidden="true"
                      className="grid size-7 shrink-0 place-items-center rounded-lg border border-[#eee4dc] bg-[#faf5ef] text-[#b97550]"
                    >
                      ✳
                    </span>
                  )}
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[82%] rounded-[14px_14px_3px_14px] border border-[#efede7] bg-[#f6f5f1] px-4 py-3"
                        : "flex-1 pt-0.5"
                    }
                  >
                    {message.role === "assistant" && (
                      <p className="mb-2 text-[11px] font-semibold text-[#8a8178]">
                        Morrow
                      </p>
                    )}
                    {message.content ? (
                      <p className="whitespace-pre-wrap text-sm leading-[1.7] text-[#494840] [overflow-wrap:anywhere]">
                        {message.content}
                      </p>
                    ) : (
                      isSending && (
                        <span
                          aria-label="Morrow is thinking"
                          className="flex gap-1 py-2"
                        >
                          <i className="size-1.5 animate-bounce rounded-full bg-[#aaa49a]" />
                          <i className="size-1.5 animate-bounce rounded-full bg-[#aaa49a] [animation-delay:150ms]" />
                          <i className="size-1.5 animate-bounce rounded-full bg-[#aaa49a] [animation-delay:300ms]" />
                        </span>
                      )
                    )}
                  </div>
                </article>
              ))}
              {error && (
                <div
                  className="flex justify-between gap-3 rounded-lg border border-[#e8cbc0] bg-[#fcf5f1] p-3 text-xs text-[#754b3b]"
                  role="alert"
                >
                  <span>{error}</span>
                  <button
                    className="font-semibold underline focus-visible:outline-2"
                    onClick={() =>
                      sendMessage(
                        undefined,
                        messages
                          .filter((message) => message.role === "user")
                          .at(-1)?.content ?? ""
                      )
                    }
                  >
                    Try again
                  </button>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="mx-auto w-[min(100%_-_24px,700px)] pb-[max(17px,env(safe-area-inset-bottom))] md:w-[min(100%_-_40px,700px)]">
          <form
            className="rounded-[13px] border border-[#dfddd6] bg-white p-3.5 pb-2.5 transition-shadow focus-within:border-[#bbb4a9] focus-within:shadow-[0_0_0_3px_rgb(185_117_80_/_10%)]"
            onSubmit={(event) => sendMessage(event)}
          >
            <label className="sr-only" htmlFor="chat-message">
              Message Morrow
            </label>
            <textarea
              className="block max-h-40 min-h-[27px] w-full resize-y border-0 bg-transparent font-sans text-sm leading-relaxed text-[#26251f] outline-none placeholder:text-[#99968f] focus-visible:outline-none"
              id="chat-message"
              placeholder="Message Morrow…"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px] text-[#77746c] md:text-[10px]">
                Press <kbd className={keycap}>Enter</kbd> to send ·{" "}
                <kbd className={keycap}>Shift + Enter</kbd> for a new line
              </span>
              <button
                aria-label="Send message"
                className="grid size-[34px] place-items-center rounded-lg bg-[#282720] text-xl leading-none text-white transition-colors hover:bg-[#49473f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a694b] disabled:cursor-not-allowed disabled:bg-[#eeede8] disabled:text-[#aaa79f]"
                disabled={!input.trim() || isSending}
                type="submit"
              >
                ↑
              </button>
            </div>
          </form>
          <p className="mt-2.5 text-center text-[9px] text-[#77746c] md:text-[10px]">
            Morrow can make mistakes. Check important information.
          </p>
        </div>
      </section>
    </main>
  );
}
