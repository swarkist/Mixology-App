import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Image } from "lucide-react";
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

  // Cocktail index for safe linking
  const [cocktailIndex, setCocktailIndex] = useState<Array<{ id: string | number; name: string }>>([]);
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

  const validIds = useMemo(() => new Set(cocktailIndex.map(c => String(c.id))), [cocktailIndex]);
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
    return onMixiOpen(({ seed, context }) => {
      setLastOpenedBy(document.activeElement as HTMLElement);
      setOpen(true);
      setMessages([]);
      setPendingContext(context);
      setMessages([
        {
          role: "assistant",
          content:
            seed ||
            "Hi there! I'm here to help you find the perfect cocktail. What are you in the mood for?",
        },
      ]);
    });
  }, []);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setOpen(false);
    setIsStreaming(false);
    if (lastOpenedBy) {
      lastOpenedBy.focus();
      setLastOpenedBy(null);
    }
  };

  // --- Safe rendering: only link internal recipes that exist -------------------
  const internalLinkRegex = /\[([^\]]+)\]\((\/recipe\/([^)#?\s]+))\)/gi;

  function sanitizeAssistantMarkdown(md: string): string {
    // Allow internal links only if id exists; try to auto-correct by name; else plain text
    md = md.replace(internalLinkRegex, (_full, label: string, _url: string, rawId: string) => {
      const id = String(rawId).trim();
      if (validIds.has(id)) return `[${label}](/recipe/${id})`;
      const corrected = nameToId.get(normalize(label));
      if (corrected) return `[${label}](/recipe/${corrected})`;
      return `${label} (not in our library)`;
    });

    // Strip any other markdown links (e.g., external) to plain text label (optional hardening)
    md = md.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, (_full, label: string) => `${label} (external)`);
    return md;
  }

  function renderWithSafeLinks(text: string) {
    const nodes: (string | JSX.Element)[] = [];
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = internalLinkRegex.exec(text))) {
      const [full, label, _url, idRaw] = m;
      const id = String(idRaw);
      if (m.index > last) nodes.push(text.slice(last, m.index));

      if (validIds.has(id)) {
        nodes.push(
          <Link
            key={m.index}
            href={`/recipe/${id}`}
            className="text-[#f3d035] hover:text-[#f3d035]/80 underline hover:no-underline"
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        );
      } else {
        nodes.push(
          <span key={m.index}>
            {label} <span className="text-xs text-zinc-400">(not in our library)</span>
          </span>
        );
      }
      last = m.index + full.length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return <>{nodes}</>;
  }
  // ---------------------------------------------------------------------------

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

      // Final pass: sanitize links based on the index we loaded
      setMessages(prev => {
        const out = [...prev];
        const last = out[out.length - 1];
        if (last?.role === "assistant" && typeof last.content === "string") {
          last.content = sanitizeAssistantMarkdown(last.content);
        }
        return out;
      });
    } catch (error: any) {
      if (error.name !== "AbortError") {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[512px] h-[85vh] md:h-[80vh] flex flex-col p-0 bg-[#181711] border-[#393628] mx-auto">
        <DialogHeader className="flex-shrink-0 px-3 md:px-4 py-3 border-b border-[#393628]">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg md:text-[22px] font-bold leading-tight tracking-[-0.015em]">
              Chat with Mixology Assistant
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
          <div className="py-3 md:py-5 w-full">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end gap-2 md:gap-3 p-2 md:p-4 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 md:w-10 shrink-0 flex items-center justify-center bg-[#393628]">
                    <MixiIconBartender size={16} className="text-[#f3d035] md:w-5 md:h-5" />
                  </div>
                )}

                <div className={`flex flex-1 flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <p
                    className={`text-[#bab49c] text-xs md:text-[13px] font-normal leading-normal ${
                      message.role === "user" ? "text-right" : ""
                    }`}
                  >
                    {message.role === "assistant" ? "Mixology Assistant" : "You"}
                  </p>
                  <div
                    className={`text-sm md:text-base font-normal leading-normal rounded-xl px-3 md:px-4 py-2 md:py-3 max-w-[280px] md:max-w-[360px] break-words ${
                      message.role === "user" ? "bg-[#f3d035] text-[#181711]" : "bg-[#393628] text-white"
                    }`}
                  >
                    {message.role === "assistant" ? renderWithSafeLinks(message.content) : message.content}
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
                  <MixiIconBartender size={16} className="text-[#f3d035] md:w-5 md:h-5" />
                </div>
                <div className="flex flex-1 flex-col gap-1 items-start">
                  <p className="text-[#bab49c] text-xs md:text-[13px] font-normal leading-normal">Mixology Assistant</p>
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
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Type your message..."
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#393628] focus:border-none h-full placeholder:text-[#bab49c] px-3 md:px-4 rounded-r-none border-r-0 pr-2 text-sm md:text-base font-normal leading-normal"
                  disabled={isStreaming}
                />
                <div className="flex border-none bg-[#393628] items-center justify-center pr-2 md:pr-4 rounded-r-xl border-l-0">
                  <div className="flex items-center gap-2 md:gap-4 justify-end">
                    <div className="hidden md:flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center justify-center p-1.5 h-auto text-[#bab49c] hover:text-white"
                        disabled={isStreaming}
                      >
                        <Image className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>
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
