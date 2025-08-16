import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle } from "lucide-react";
import { Link } from "wouter";

import MixiIconBartender from "@/components/icons/MixiIconBartender";
import { onMixiOpen } from "@/lib/mixiBus";
import { useCocktailIndex } from "../../hooks/useCocktailIndex";

type Msg = { role: "user" | "assistant"; content: string };

export default function MixiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey, I’m Mixi! Ask me about cocktails, substitutes, tags (tiki/holiday/dessert), or how to scale a recipe to your pitcher." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingContext, setPendingContext] = useState<any>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  // Load minimal cocktail index to validate/auto-correct links
  const { data: cocktailIndex = [] } = useCocktailIndex();
  const validIds = useMemo(
    () => new Set(cocktailIndex.map((c) => String(c.id))),
    [cocktailIndex]
  );
  const nameToId = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
    const m = new Map<string, string>();
    for (const c of cocktailIndex) m.set(norm(c.name), String(c.id));
    return m;
  }, [cocktailIndex]);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  // Allow any CTA to open Mixi with seed/context
  useEffect(() => {
    return onMixiOpen(({ seed, context }) => {
      setOpen(true);
      if (seed) {
        setMessages((m) => [...m, { role: "assistant", content: seed }]);
      }
      if (context) setPendingContext(context);
    });
  }, []);

  // --- Link safety/sanitization ------------------------------------------------

  // Replace/strip unsafe links in assistant markdown after streaming is done.
  function sanitizeAssistantMarkdown(md: string): string {
    // 1) Allow ONLY links of the form [Name](/recipe/<id>) — but keep them
    //     *only* if <id> exists. If the name matches a DB item, auto-correct the id.
    md = md.replace(
      /\[([^\]]+)\]\((\/recipe\/([^)#?\s]+))\)/gi,
      (_full, label: string, _url: string, rawId: string) => {
        const id = String(rawId).trim();
        if (validIds.has(id)) return `[${label}](/recipe/${id})`;
        // Try to auto-correct by name when id is wrong/made up
        const norm = label.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
        const corrected = nameToId.get(norm);
        if (corrected) return `[${label}](/recipe/${corrected})`;
        // Unknown → render as plain text with note, *no link*
        return `${label} (not in our library)`;
      }
    );

    // 2) Strip any other markdown links (e.g., external) to plain text label (optional hardening)
    md = md.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, (_full, label: string) => {
      return `${label} (external)`;
    });

    return md;
  }

  // Render assistant text with safe internal links only
  const internalLinkRegex = /\[([^\]]+)\]\((\/recipe\/([^)#?\s]+))\)/gi;
  function renderWithSafeLinks(text: string) {
    const nodes: any[] = [];
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = internalLinkRegex.exec(text))) {
      const [full, label, _url, idRaw] = m;
      const id = String(idRaw);
      if (m.index > last) nodes.push(text.slice(last, m.index));

      if (validIds.has(id)) {
        nodes.push(
          <Link key={m.index} href={`/recipe/${id}`} className="underline underline-offset-2 decoration-yellow-500 hover:text-yellow-400">
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

  // --- Chat send/stream --------------------------------------------------------

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");

    const next = [...messages, { role: "user", content: userText } as Msg];
    setMessages(next);
    setLoading(true);

    const r = await fetch("/api/mixi/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            // simple concat so the model sees the full user thread (keeps server simple)
            content: next.filter((m) => m.role === "user").map((m) => m.content).join("\n\n---\n\n"),
          },
        ],
        context: pendingContext || undefined,
      }),
    });

    if (!r.ok || !r.body) {
      setLoading(false);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I’m sorry. Looks like my mind is not working at the moment. Please try again later." },
      ]);
      return;
    }

    // Prepare an empty assistant message to stream into
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    const reader = r.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let partial = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      partial += chunk;

      // Parse SSE "data: {json}"
      const lines = partial.split("\n");
      partial = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content || "";
          if (delta) {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") last.content += delta;
              return copy;
            });
          }
        } catch {
          // ignore malformed frames
        }
      }
    }

    // Stream finished → sanitize links in the last assistant message
    setLoading(false);
    setMessages((prev) => {
      const out = [...prev];
      const last = out[out.length - 1];
      if (last?.role === "assistant" && typeof last.content === "string") {
        last.content = sanitizeAssistantMarkdown(last.content);
      }
      return out;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        aria-label="Open Mixi chat"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3 shadow-lg bg-yellow-500 text-black hover:bg-yellow-400"
      >
        <MessageCircle className="w-5 h-5" />
        <span>Mixi</span>
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 w-[min(420px,94vw)] z-50">
          <Card className="border-yellow-600/40">
            <CardHeader className="bg-black/60 flex items-center gap-2">
              <div className="rounded-full border border-yellow-500/40 p-1 text-yellow-400">
                <MixiIconBartender size={22} />
              </div>
              <CardTitle className="text-yellow-400">Mixi</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div ref={viewportRef} className="max-h-[52vh] overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                    <div
                      className={`inline-block rounded-md px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-yellow-500 text-black"
                          : "bg-zinc-900 text-zinc-100 border border-zinc-800"
                      }`}
                    >
                      {m.role === "assistant" ? renderWithSafeLinks(m.content) : m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Mixi is thinking…
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800 p-3 flex gap-2">
                <Input
                  placeholder="Ask Mixi anything…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <Button onClick={send} disabled={loading || !input.trim()} variant="secondary">
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
