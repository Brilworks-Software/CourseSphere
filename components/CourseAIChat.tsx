"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertCircle,
  Brain,
  Send,
  Loader,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Source {
  lessonId: string | null;
  similarity: number;
  excerpt: string;
}

interface ChatMessage {
  type: "user" | "assistant";
  text: string;
  sources?: Source[];
}

interface CourseAIChatProps {
  courseId: string;
  courseTitle?: string;
  float?: boolean; // show as floating minimizable assistant
}

export function CourseAIChat({
  courseId,
  courseTitle,
  float = true,
}: CourseAIChatProps) {
  const [hasTranscripts, setHasTranscripts] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    [],
  );

  // Floating / minimizable state (default closed)
  const [open, setOpen] = useState<boolean>(false);
  // Visibility for non-floating placement (allow close + reopen)
  const [visible, setVisible] = useState<boolean>(true);

  const handleClose = () => {
    if (float) setOpen(false);
    else setVisible(false);
  };

  const handleOpen = () => {
    if (float) setOpen(true);
    else setVisible(true);
  };

  const [showSources, setShowSources] = useState(true);

  // Check if course has transcripts on mount
  useEffect(() => {
    checkTranscriptAvailability();
  }, [courseId]);

  const checkTranscriptAvailability = async () => {
    try {
      setIsChecking(true);
      const response = await fetch(
        `/api/transcripts/check-available?courseId=${courseId}`,
      );
      const data = await response.json();

      if (data.success) {
        setHasTranscripts(data.hasTranscripts);
      }
    } catch (err) {
      console.error("Error checking transcripts:", err);
      setHasTranscripts(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Add user message to history
      const userMessage = message;
      setConversationHistory((prev) => [
        ...prev,
        { type: "user", text: userMessage },
      ]);
      setMessage("");

      // Send to server with courseId
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId, // Server will fetch transcripts for this course
          message: userMessage,
          courseTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to get response");
        return;
      }

      // Add assistant reply to history with sources if available
      const assistantMessage: ChatMessage = {
        type: "assistant",
        text: data.reply,
      };

      if (data.sources && data.sources.length > 0) {
        assistantMessage.sources = data.sources;
      }

      setConversationHistory((prev) => [...prev, assistantMessage]);
      setReply(data.reply);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Use a composite key `${messageIndex}-${sourceIndex}` so sources
  // across different messages don't collide.
  const [expandedSourceKeys, setExpandedSourceKeys] = useState<Set<string>>(
    new Set(),
  );

  const toggleSourceExpanded = (key: string) => {
    setExpandedSourceKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const assistantCard = (
    <Card className="">
      <CardHeader>
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            <Brain size={16} />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-base">Course AI Assistant</CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground">
              Ask questions about {courseTitle || "this course"}
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleClose}
              aria-label="Close assistant"
              className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isChecking ? (
          <div className="p-6">
            <div className="flex items-center gap-2">
              <Loader className="animate-spin" size={20} />
              <span className="text-muted-foreground">
                Loading AI Assistant...
              </span>
            </div>
          </div>
        ) : !hasTranscripts ? (
          <div className="p-6 bg-muted/50 rounded-lg border">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-foreground">
                  AI Assistant Unavailable
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The AI assistant will be available once course lessons have
                  transcripts. Make sure videos are uploaded and transcripts are
                  processed.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Conversation History
          <>
            {conversationHistory.length > 0 ? (
              <div className="flex flex-col gap-4 max-h-96 overflow-y-auto p-2">
                {conversationHistory.map((msg, idx) => {
                  const isUser = msg.type === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex items-end ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-muted/20 text-muted-foreground flex items-center justify-center mr-2">
                          <Brain size={14} />
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted text-muted-foreground rounded-tl-none"
                        }`}
                      >
                        {isUser ? (
                          msg.text
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center ml-2 text-xs font-semibold">
                          You
                        </div>
                      )}

                      {/* {!isUser &&
                        msg.sources &&
                        msg.sources.length > 0 &&
                        showSources && (
                          <div className="w-full mt-2 ml-10">
                            <div className="flex flex-col gap-2">
                              {msg.sources.map((source, srcIdx) => {
                                const key = `${idx}-${srcIdx}`;
                                const expanded = expandedSourceKeys.has(key);
                                return (
                                  <div
                                    key={srcIdx}
                                    className="bg-muted/50 border rounded p-2 text-xs"
                                  >
                                    <button
                                      onClick={() => toggleSourceExpanded(key)}
                                      className="w-full flex items-center justify-between text-left font-semibold text-muted-foreground hover:text-foreground"
                                    >
                                      <div className="flex items-center gap-2">
                                        {expanded ? (
                                          <ChevronUp size={14} />
                                        ) : (
                                          <ChevronDown size={14} />
                                        )}
                                        <span>
                                          Lesson: {source.lessonId}(
                                          {source.similarity.toFixed(1)})
                                        </span>
                                      </div>
                                    </button>
                                    {expanded && (
                                      <p className="text-muted-foreground mt-2 text-xs italic">
                                        "{source.excerpt}"
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )} */}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                Start the conversation — ask anything about the course.
              </div>
            )}
          </>
        )}
      </CardContent>

      {!isChecking && hasTranscripts && (
        <CardFooter className="flex flex-col gap-3 pt-0">
          {error && (
            <div className="p-3 rounded text-sm text-destructive">{error}</div>
          )}

          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              className="rounded-full"
              placeholder="Ask a question about the course..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              disabled={loading || !message.trim()}
              size="icon"
              aria-label="Send message"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </form>

          <div className="w-full flex items-center justify-between text-xs">
            <p className="text-muted-foreground">
              💡 Answers are based on course lesson transcripts.
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );

  if (float) {
    return (
      <>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
          >
            {isChecking ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <Brain size={20} />
            )}
          </button>
        )}

        {open && (
          <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[360px] md:w-[420px] max-h-[80vh]">
            {assistantCard}
          </div>
        )}
      </>
    );
  }

  // If transcript check finished and there are no transcripts,
  // hide the entire AI assistant (including floating button).
  if (!isChecking && !hasTranscripts) {
    return null;
  }

  // Non-floating placement: allow collapsing to a small FAB
  if (!visible) {
    return (
      <button
        onClick={handleOpen}
        aria-expanded={visible}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
      >
        <Brain size={20} />
      </button>
    );
  }

  return assistantCard;
}
