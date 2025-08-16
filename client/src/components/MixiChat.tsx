import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";
import MixiIconBartender from "@/components/icons/MixiIconBartender";
import { onMixiOpen, type MixiOpenDetail } from "@/lib/mixiBus";

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for global open events
  useEffect(() => {
    return onMixiOpen(({ seed, context }) => {
      // Store the currently focused element to return focus later
      setLastOpenedBy(document.activeElement as HTMLElement);
      
      setOpen(true);
      
      // Clear previous messages and context
      setMessages([]);
      setPendingContext(context || null);
      
      // Add seed message if provided
      if (seed) {
        setMessages([{ role: "assistant", content: seed }]);
      }
    });
  }, []);

  // Handle dialog close - return focus to triggering element
  const handleClose = () => {
    setOpen(false);
    
    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    
    // Return focus to the element that opened the chat
    if (lastOpenedBy && document.contains(lastOpenedBy)) {
      setTimeout(() => {
        lastOpenedBy?.focus();
      }, 100);
    }
    setLastOpenedBy(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsStreaming(true);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/mixi/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          context: pendingContext
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader");
      }

      // Start with an empty assistant message
      let assistantMessage = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantMessage += parsed.content;
                  // Update the last message (assistant message) with new content
                  setMessages(prev => [
                    ...prev.slice(0, -1),
                    { role: "assistant", content: assistantMessage }
                  ]);
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm sorry. Looks like my mind is not working at the moment. Please try again later." 
        }
      ]);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      // Clear context after first message
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
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-[#544f3a]">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-yellow-500/40 p-1">
              <MixiIconBartender size={24} className="text-yellow-400" />
            </div>
            <DialogTitle className="text-white">Mixi</DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-4 top-4 text-[#bab59b] hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="rounded-full border border-yellow-500/40 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MixiIconBartender size={32} className="text-yellow-400" />
                </div>
                <p className="text-[#bab59b]">Hello! I'm Mixi, your AI bartender. How can I help you today?</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="rounded-full border border-yellow-500/40 p-1 h-8 w-8 flex-shrink-0 flex items-center justify-center">
                    <MixiIconBartender size={16} className="text-yellow-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-yellow-500 text-black"
                      : "bg-[#26261c] border border-[#544f3a] text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            
            {isStreaming && (
              <div className="flex gap-3 justify-start">
                <div className="rounded-full border border-yellow-500/40 p-1 h-8 w-8 flex-shrink-0 flex items-center justify-center">
                  <MixiIconBartender size={16} className="text-yellow-400" />
                </div>
                <div className="bg-[#26261c] border border-[#544f3a] text-white rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 border-t border-[#544f3a] p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Mixi anything about cocktails..."
              className="flex-1 bg-[#26261c] border-[#544f3a] text-white placeholder:text-[#bab59b] focus-visible:ring-yellow-500"
              disabled={isStreaming}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="bg-yellow-500 hover:bg-yellow-400 text-black"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}