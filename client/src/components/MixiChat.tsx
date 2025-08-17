import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { Link } from "wouter";
import MixiIconBartender from "@/components/icons/MixiIconBartender";
import { onMixiOpen } from "@/lib/mixiBus";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function MixiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingContext, setPendingContext] = useState<any>(null);
  const [lastOpenedBy, setLastOpenedBy] = useState<HTMLElement | null>(null);

  // Cocktail index for safe linking (fetched once here; no extra hook required)
  const [cocktailIndex, setCocktailIndex] = useState<Array<{ id: string | number; name: string }>>([]);
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

  const nameToId = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cocktailIndex) m.set(normalize(c.name), String(c.id));
    return m;
  }, [cocktailIndex]);

  // Load minimal cocktail index once
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cocktails?fields=id,name");
        if (r.ok) {
          setCocktailIndex(await r.json());
        } else {
          // fallback if ?fields not supported
          const r2 = await fetch("/api/cocktails");
          if (r2.ok) setCocktailIndex(await r2.json());
        }
      } catch {
        // non-fatal; if we can't load the index, links will just be plain text
        setCocktailIndex([]);
      }
    })();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for global open events  
  useEffect(() => {
    return onMixiOpen(({ seed, context, initialUserMessage }) => {
      setLastOpenedBy(document.activeElement as HTMLElement);
      setOpen(true);
      setMessages([]);
      setPendingContext(context);
      
      const assistantMessage = {
        role: "assistant" as const,
        content: seed || "Hi there! I'm here to help you find the perfect cocktail. What are you in the mode for?",
      };
      
      if (initialUserMessage) {
        // If there's an initial user message, add it and immediately send it
        const userMessage = { role: "user" as const, content: initialUserMessage };
        setMessages([assistantMessage, userMessage]);
        // Trigger the API call with the initial message after component settles
        setTimeout(() => {
          // Call sendMessageWithContent but make sure it's defined first
          const sendInitialMessage = async () => {
            if (!initialUserMessage.trim() || isStreaming) return;

            setIsStreaming(true);

            try {
              abortControllerRef.current = new AbortController();

              const response = await fetch("/api/mixi/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [assistantMessage, { role: "user", content: initialUserMessage }],
                  context: context,
                }),
                signal: abortControllerRef.current.signal,
              });

              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

              const reader = response.body?.getReader();
              if (!reader) throw new Error("No response body");

              let streamingResponse = "";
              setMessages(prev => [...prev, { role: "assistant", content: "" }]);

              const decoder = new TextDecoder();
              let partial = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                partial += decoder.decode(value, { stream: true });
                const lines = partial.split("\n");
                partial = lines.pop() || "";

                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr || jsonStr === "[DONE]") continue;
                  try {
                    const data = JSON.parse(jsonStr);
                    const delta = data.content || data.choices?.[0]?.delta?.content || "";
                    if (delta) {
                      streamingResponse += delta;
                      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: streamingResponse }]);
                    }
                  } catch {
                    // ignore malformed frames
                  }
                }
              }
            } catch (error: any) {
              if (
                error !== "chat closed" &&
                error?.message !== "chat closed" &&
                error?.name !== "AbortError"
              ) {
                console.error("Chat error:", error);
                setMessages(prev => [
                  ...prev,
                  { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." },
                ]);
              }
            } finally {
              setIsStreaming(false);
              abortControllerRef.current = null;
              setPendingContext(null);
            }
          };
          sendInitialMessage();
        }, 100);
      } else {
        setMessages([assistantMessage]);
      }
    });
  }, []);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("chat closed");
      abortControllerRef.current = null;
    }
    setOpen(false);
    setIsStreaming(false);
    if (lastOpenedBy) {
      lastOpenedBy.focus();
      setLastOpenedBy(null);
    }
  };

  // --- Safe linking helpers (link by NAME only, ignore model IDs) -------------
  // Matches markdown-style internal links like [Name](/recipe/something)
  const internalLinkRegex = /\[([^\]]+)\]\((\/recipe\/([^)#?\s]+))\)/gi;

  function renderSimpleMarkdown(segment: string) {
    const parts: (string | JSX.Element)[] = [];
    const mdRegex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mdRegex.exec(segment))) {
      if (match.index > lastIndex) {
        parts.push(segment.slice(lastIndex, match.index));
      }

      const [, bold, italic] = match;
      if (bold !== undefined) {
        parts.push(<strong key={match.index}>{bold}</strong>);
      } else if (italic !== undefined) {
        parts.push(<em key={match.index}>{italic}</em>);
      }

      lastIndex = mdRegex.lastIndex;
    }

    if (lastIndex < segment.length) {
      parts.push(segment.slice(lastIndex));
    }
    return parts;
  }

  function renderSafeInline(text: string) {
    // Render inline text but preserve safe internal links only
    const nodes: (string | JSX.Element)[] = [];
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = internalLinkRegex.exec(text))) {
      const [full, label] = m;
      if (m.index > last) nodes.push(...renderSimpleMarkdown(text.slice(last, m.index)));

      const idByName = nameToId.get(normalize(label));
      if (idByName) {
        nodes.push(
          <Link
            key={m.index}
            href={`/recipe/${idByName}`}
            className="text-[#f3d035] hover:text-[#f3d035]/80 underline hover:no-underline"
            onClick={() => setOpen(false)}
          >
            {renderSimpleMarkdown(label)}
          </Link>
        );
      } else {
        nodes.push(
          <span key={m.index}>
            {renderSimpleMarkdown(label)} <span className="text-xs text-zinc-400">(not in our library)</span>
          </span>
        );
      }
      last = m.index + full.length;
    }

    if (last < text.length) {
      const tail = text
        .slice(last)
        .replace(/\/recipe\/([^\s)]+)\b/gi, full => `${full} (not linked)`);
      nodes.push(...renderSimpleMarkdown(tail));
    }
    return <>{nodes}</>;
  }
  // ---------------------------------------------------------------------------

  // --- Formatting helpers (lists/sections) ------------------------------------
  // Normalize paragraphs that cram "1. X 2. Y 3. Z" into a single line → line-per-item
  function normalizeForLists(text: string) {
    // Ensure a newline before any numbered item not at line-start
    text = text.replace(/(?<!^|\n)(\s*)(\d+)\.\s+/g, "\n$2. ");
    // Ensure a newline before bullets like " • "
    text = text.replace(/\s+•\s+/g, "\n• ");
    // Make sure "Ingredients:" and "Instructions:" are on their own lines with spacing
    text = text.replace(/\s*(\*{0,2}\s*Ingredients:?\s*\*{0,2})/gi, "\n\n$1\n");
    text = text.replace(/\s*(\*{0,2}\s*Instructions:?\s*\*{0,2})/gi, "\n\n$1\n");
    return text;
  }

  type Block =
    | { kind: "ol"; items: string[] }
    | { kind: "ul"; items: string[] }
    | { kind: "p"; text: string }
    | { kind: "h"; text: string };

  function splitIntoBlocks(text: string): Block[] {
    const out: Block[] = [];
    const lines = normalizeForLists(text).split(/\r?\n/).map(l => l.trim());
    let i = 0;

    function flushParagraph(buf: string[]) {
      const joined = buf.join(" ").trim();
      if (joined) out.push({ kind: "p", text: joined });
    }

    while (i < lines.length) {
      const line = lines[i];

      // headers
      if (/^\*{0,2}\s*ingredients:?/i.test(line) || /^\*{0,2}\s*instructions:?/i.test(line)) {
        out.push({ kind: "h", text: line.replace(/\*/g, "").trim() });
        i++;
        continue;
      }

      // ordered list block (consecutive lines starting with "1. ", "2. ", etc.)
      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s+/, "").trim());
          i++;
        }
        out.push({ kind: "ol", items });
        continue;
      }

      // unordered list block (• or -)
      if (/^(•|-)\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^(•|-)\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^(•|-)\s+/, "").trim());
          i++;
        }
        out.push({ kind: "ul", items });
        continue;
      }

      // paragraph accumulation
      if (line) {
        const buf: string[] = [line];
        // absorb subsequent non-list, non-header lines into same paragraph
        let j = i + 1;
        while (j < lines.length && lines[j] && !/^\d+\.\s+/.test(lines[j]) && !/^(•|-)\s+/.test(lines[j]) && !/^\*{0,2}\s*(ingredients|instructions):?/i.test(lines[j])) {
          buf.push(lines[j]);
          j++;
        }
        flushParagraph(buf);
        i = j;
        continue;
      }

      i++; // empty line
    }

    return out;
  }

  function renderAssistantMessage(text: string) {
    const blocks = splitIntoBlocks(text);
    return (
      <>
        {blocks.map((b, idx) => {
          if (b.kind === "h") {
            const label = b.text.replace(/\*+/g, "");
            return (
              <div key={idx} className="mt-2 mb-1 font-semibold text-[#f3d035]">
                {label}
              </div>
            );
          }
          if (b.kind === "ol") {
            return (
              <ol key={idx} className="list-decimal ml-5 space-y-1">
                {b.items.map((it, i2) => (
                  <li key={i2} className="text-white">
                    {renderSafeInline(it)}
                  </li>
                ))}
              </ol>
            );
          }
          if (b.kind === "ul") {
            return (
              <ul key={idx} className="list-disc ml-5 space-y-1">
                {b.items.map((it, i2) => (
                  <li key={i2} className="text-white">
                    {renderSafeInline(it)}
                  </li>
                ))}
              </ul>
            );
          }
          // paragraph
          return (
            <p key={idx} className="text-white">
              {renderSafeInline(b.text)}
            </p>
          );
        })}
      </>
    );
  }
  // ---------------------------------------------------------------------------

  const sendMessageWithContent = async (messageContent: string) => {
    if (!messageContent.trim() || isStreaming) return;

    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/mixi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: messageContent }],
          context: pendingContext,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let assistantMessage = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const decoder = new TextDecoder();
      let partial = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });
        const lines = partial.split("\n");
        partial = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const data = JSON.parse(jsonStr);
            const delta = data.content || data.choices?.[0]?.delta?.content || "";
            if (delta) {
              assistantMessage += delta;
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: assistantMessage }]);
            }
          } catch {
            // ignore malformed frames
          }
        }
      }
    } catch (error: any) {
      if (
        error !== "chat closed" &&
        error?.message !== "chat closed" &&
        error?.name !== "AbortError"
      ) {
        console.error("Chat error:", error);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." },
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setPendingContext(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/mixi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          context: pendingContext,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let assistantMessage = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const decoder = new TextDecoder();
      let partial = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });
        const lines = partial.split("\n");
        partial = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const data = JSON.parse(jsonStr);
            const delta = data.content || data.choices?.[0]?.delta?.content || "";
            if (delta) {
              assistantMessage += delta;
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: assistantMessage }]);
            }
          } catch {
            // ignore malformed frames
          }
        }
      }
    } catch (error: any) {
      if (
        error !== "chat closed" &&
        error?.message !== "chat closed" &&
        error?.name !== "AbortError"
      ) {
        console.error("Chat error:", error);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." },
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setPendingContext(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else handleClose();
      }}
    >
      <DialogContent className="w-[95vw] max-w-[512px] h-[85vh] md:h-[80vh] flex flex-col p-0 bg-[#181711] border-[#393628] mx-auto">
        <DialogHeader className="flex-shrink-0 px-3 md:px-4 py-3 border-b border-[#393628]">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg md:text-[22px] font-bold leading-tight tracking-[-0.015em]">
              Chat with Mixi
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-[#bab49c] hover:text-white h-auto p-1"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-2 md:px-4">
          <div className="py-3 md:py-5 w-full space-y-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end gap-2 md:gap-3 p-2 md:p-4 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 md:w-10 shrink-0 flex items-center justify-center bg-[#393628]">
                    <MixiIconBartender size={20} className="text-[#f3d035] md:w-6 md:h-6" />
                  </div>
                )}

                <div className={`flex flex-1 flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <p
                    className={`text-[#bab49c] text-xs md:text-[13px] font-normal leading-normal ${
                      message.role === "user" ? "text-right" : ""
                    }`}
                  >
                    {message.role === "assistant" ? "Mixi" : "You"}
                  </p>
                  <div
                    className={`text-sm md:text-base font-normal leading-normal rounded-xl px-3 md:px-4 py-2 md:py-3 max-w-[280px] md:max-w-[360px] break-words ${
                      message.role === "user" ? "bg-[#f3d035] text-[#181711]" : "bg-[#393628] text-white"
                    }`}
                  >
                    {message.role === "assistant" ? renderAssistantMessage(message.content) : message.content}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 md:w-10 shrink-0 flex items-center justify-center bg-[#f3d035] text-[#181711] font-bold text-xs md:text-sm">
                    U
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div className="flex items-end gap-2 md:gap-3 p-2 md:p-4">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 md:w-10 shrink-0 flex items-center justify-center bg-[#393628]">
                  <MixiIconBartender size={20} className="text-[#f3d035] md:w-6 md:h-6" />
                </div>
                <div className="flex flex-1 flex-col gap-1 items-start">
                  <p className="text-[#bab49c] text-xs md:text-[13px] font-normal leading-normal">Mixi</p>
                  <div className="bg-[#393628] text-white rounded-xl px-3 md:px-4 py-2 md:py-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#f3d035] rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#f3d035] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#f3d035] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 px-3 md:px-4 py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex flex-col min-w-0 h-10 md:h-12 flex-1">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), !isStreaming && sendMessage())}
                  placeholder="Type your message..."
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#393628] focus:border-none h-full placeholder:text-[#bab49c] px-3 md:px-4 rounded-r-none border-r-0 pr-2 text-sm md:text-base font-normal leading-normal"
                  disabled={isStreaming}
                />
                <div className="flex border-none bg-[#393628] items-center justify-center pr-2 md:pr-4 rounded-r-xl border-l-0">
                  <div className="flex items-center justify-end">
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isStreaming}
                      className="min-w-[60px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-7 md:h-8 px-3 md:px-4 bg-[#f3d035] hover:bg-[#f3d035]/90 text-[#181711] text-xs md:text-sm font-medium leading-normal"
                    >
                      <span className="truncate">Send</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
