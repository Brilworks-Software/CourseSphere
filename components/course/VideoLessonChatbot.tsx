"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader, Send, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

interface VideoLessonChatbotProps {
  lessonTranscript: string | null;
  courseTitle?: string;
  lessonTitle?: string;
  isVisible?: boolean;
  onClose?: () => void;
}

export default function VideoLessonChatbot({
  lessonTranscript,
  courseTitle = "Course",
  lessonTitle = "Lesson",
  isVisible = true,
  onClose,
}: VideoLessonChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your AI assistant for "${lessonTitle}". Ask me anything about this lesson!`,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          transcript: lessonTranscript || undefined,
          courseTitle,
          lessonTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content:
          error.message ||
          "Sorry, I couldn't generate a response. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="h-full flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs opacity-80">
              {lessonTranscript ? "With context" : "Ready to help"}
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2 text-xs",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {message.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-3.5 h-3.5 text-secondary-foreground" />
              </div>
            )}

            <div
              className={cn(
                "max-w-xs px-3 py-2 rounded-lg leading-relaxed text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none font-medium"
                  : "bg-secondary/50 text-secondary-foreground rounded-bl-none",
              )}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => (
                      <p className="mb-2 last:mb-0 break-words" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc list-inside mb-2 space-y-1"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal list-inside mb-2 space-y-1"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="ml-2" {...props} />
                    ),
                    code: ({ node, ...props }) => (
                      <code
                        className="bg-primary/20 px-1.5 py-0.5 rounded text-xs font-mono inline-block"
                        {...props}
                      />
                    ),
                    pre: ({ node, ...props }) => (
                      <pre
                        className="block bg-primary/10 p-2 rounded text-xs font-mono my-2 overflow-x-auto"
                        {...props}
                      />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-2 border-primary/30 pl-3 py-1 my-2 italic"
                        {...props}
                      />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        className="text-primary underline hover:opacity-80"
                        {...props}
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-bold" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                      <em className="italic" {...props} />
                    ),
                    h1: ({ node, ...props }) => (
                      <h1 className="text-lg font-bold mb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-base font-semibold mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-sm font-semibold mb-1" {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>

            {message.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground text-xs font-bold">
                U
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-full bg-secondary/80 flex items-center justify-center flex-shrink-0">
              <Loader className="w-3.5 h-3.5 text-secondary-foreground animate-spin" />
            </div>
            <div className="bg-secondary/50 rounded-lg rounded-bl-none px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
                <div
                  className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-muted/40">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="text-xs h-9 rounded-lg bg-background placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !inputValue.trim()}
            className="h-9 w-9 p-0 rounded-lg flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
