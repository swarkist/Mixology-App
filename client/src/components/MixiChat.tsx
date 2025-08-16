import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Image } from "lucide-react";
import { Link } from "wouter";
import MixiIconBartender from "@/components/icons/MixiIconBartender";
import { onMixiOpen, type MixiOpenDetail } from "@/lib/mixiBus";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Helper function to parse and render links in messages
const parseMessageContent = (content: string, setOpen: (open: boolean) => void) => {
  // Parse markdown-style links [text](/path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add the link
    const linkText = match[1];
    const linkPath = match[2];
    parts.push(
      <Link 
        key={match.index} 
        href={linkPath}
        className="text-[#f3d035] hover:text-[#f3d035]/80 underline hover:no-underline"
        onClick={() => {
          // Close the chat when navigating
          setOpen(false);
        }}
      >
        {linkText}
      </Link>
    );
    
    lastIndex = linkRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [content];
};

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
      setPendingContext(context);
      
      // Add initial greeting if no seed provided
      if (!seed) {
        setMessages([{
          role: "assistant",
          content: "Hi there! I'm here to help you find the perfect cocktail. What are you in the mood for?"
        }]);
      } else {
        setMessages([{
          role: "assistant", 
          content: seed
        }]);
      }
    });
  }, []);

  const handleClose = () => {
    // Abort any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setOpen(false);
    setIsStreaming(false);
    
    // Return focus to the element that opened the chat
    if (lastOpenedBy) {
      lastOpenedBy.focus();
      setLastOpenedBy(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch("/api/mixi/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          context: pendingContext,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let assistantMessage = "";
      
      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage += data.content;
                // Update the last message (assistant message)
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: assistantMessage }
                ]);
              }
            } catch (e) {
              // Ignore parsing errors for SSE
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Chat error:", error);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." }
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setPendingContext(null); // Clear context after first message
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
              <div key={index} className={`flex items-end gap-2 md:gap-3 p-2 md:p-4 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 md:w-10 shrink-0 flex items-center justify-center bg-[#393628]">
                    <MixiIconBartender size={16} className="text-[#f3d035] md:w-5 md:h-5" />
                  </div>
                )}
                
                <div className={`flex flex-1 flex-col gap-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <p className={`text-[#bab49c] text-xs md:text-[13px] font-normal leading-normal ${message.role === "user" ? "text-right" : ""}`}>
                    {message.role === "assistant" ? "Mixology Assistant" : "You"}
                  </p>
                  <div className={`text-sm md:text-base font-normal leading-normal rounded-xl px-3 md:px-4 py-2 md:py-3 max-w-[280px] md:max-w-[360px] break-words ${
                    message.role === "user" 
                      ? "bg-[#f3d035] text-[#181711]" 
                      : "bg-[#393628] text-white"
                  }`}>
                    {message.role === "assistant" 
                      ? parseMessageContent(message.content, setOpen)
                      : message.content
                    }
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
                  <p className="text-[#bab49c] text-xs md:text-[13px] font-normal leading-normal">
                    Mixology Assistant
                  </p>
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
                  onKeyPress={handleKeyPress}
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