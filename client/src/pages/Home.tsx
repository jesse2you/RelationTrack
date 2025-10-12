import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Send, Sparkles, Settings, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import SettingsDialog from "@/components/SettingsDialog";
import MessageFeedback from "@/components/MessageFeedback";
import type { Conversation, Message } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingProvider, setStreamingProvider] = useState<string | null>(null);
  const [streamingModel, setStreamingModel] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = (user as any)?.isAdmin;

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/conversations", { title });
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (data?.id) {
        setSelectedConversation(data.id);
      }
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, conversationId }: { content: string; conversationId: string }) => {
      if (!conversationId) throw new Error("No conversation selected");
      
      setIsStreaming(true);
      setStreamingMessage("");
      setStreamingProvider(null);
      setStreamingModel(null);
      setStreamError(null);

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        setIsStreaming(false);
        setStreamError(`Request failed: ${response.statusText}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setIsStreaming(false);
        setStreamError("Failed to read response stream");
        return;
      }

      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                setStreamError(null);
                // Invalidate queries to refetch messages
                queryClient.invalidateQueries({ 
                  predicate: (query) => {
                    const [first, second] = query.queryKey;
                    return first === "/api/conversations" && (second === "messages" || typeof second === "string");
                  }
                }).then(() => {
                  // Clear streaming UI after messages are loaded
                  setTimeout(() => {
                    setStreamingMessage("");
                    setStreamingProvider(null);
                    setStreamingModel(null);
                  }, 100);
                });
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  setStreamError(parsed.error);
                  setIsStreaming(false);
                  return;
                }
                if (parsed.content) {
                  setStreamingMessage(prev => prev + parsed.content);
                }
                if (parsed.model) {
                  setStreamingModel(parsed.model);
                  setStreamingProvider(parsed.provider);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (error: any) {
        setIsStreaming(false);
        setStreamError(error.message || "Stream error occurred");
      }
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const messageContent = input;
    setInput("");

    if (!selectedConversation) {
      // Create new conversation first, then send message
      createConversationMutation.mutate(messageContent.slice(0, 50), {
        onSuccess: (conv) => {
          sendMessageMutation.mutate({ content: messageContent, conversationId: conv.id });
        },
      });
    } else {
      sendMessageMutation.mutate({ content: messageContent, conversationId: selectedConversation });
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const getProviderColor = (provider: string | null) => {
    switch (provider) {
      case 'gpt-4o': return 'text-purple-500';
      case 'gpt-4o-mini': return 'text-cyan-500';
      case 'o3-mini': return 'text-emerald-500';
      default: return 'text-blue-500';
    }
  };

  const getProviderLabel = (model: string | null) => {
    if (!model) return 'AI';
    if (model.includes('gpt-4o-mini')) return 'GPT-4o Mini';
    if (model.includes('gpt-4o')) return 'GPT-4o';
    if (model.includes('o3-mini')) return 'O3-mini';
    return 'AI';
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <Button
          data-testid="button-new-chat"
          onClick={() => {
            setSelectedConversation(null);
            setInput("");
          }}
          className="mb-4 w-full"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Chat
        </Button>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                data-testid={`button-conversation-${conv.id}`}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors hover-elevate ${
                  selectedConversation === conv.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="text-sm font-medium truncate">{conv.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Agent Router
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ask anything - I'll route your question to the best AI
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.href = "/admin"}
                data-testid="button-admin-panel"
                title="Admin Panel"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
              data-testid="button-open-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {!selectedConversation && messages.length === 0 && !streamingMessage && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-cyan-500 to-emerald-500 mb-6">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Ask me anything</h2>
                <p className="text-muted-foreground mb-8">
                  I'll automatically choose the best AI for your question
                </p>
                <div className="grid gap-4 max-w-2xl mx-auto">
                  <button
                    data-testid="button-example-code"
                    onClick={() => setInput("Write a Python function to calculate fibonacci numbers")}
                    className="p-4 rounded-lg border bg-card hover-elevate text-left"
                  >
                    <div className="text-sm font-medium">Write a Python function to calculate fibonacci numbers</div>
                  </button>
                  <button
                    data-testid="button-example-creative"
                    onClick={() => setInput("Write a short story about a time traveler")}
                    className="p-4 rounded-lg border bg-card hover-elevate text-left"
                  >
                    <div className="text-sm font-medium">Write a short story about a time traveler</div>
                  </button>
                  <button
                    data-testid="button-example-analysis"
                    onClick={() => setInput("Explain the difference between TCP and UDP")}
                    className="p-4 rounded-lg border bg-card hover-elevate text-left"
                  >
                    <div className="text-sm font-medium">Explain the difference between TCP and UDP</div>
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-3xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl p-4"
                      : "bg-card border-l-4 border-purple-500 rounded-2xl p-6"
                  }`}
                  data-testid={`message-${msg.id}`}
                >
                  {msg.role === "assistant" && msg.model && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`text-sm font-semibold ${getProviderColor(msg.model)}`}>
                        {getProviderLabel(msg.model)}
                      </div>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  {msg.role === "assistant" && (
                    <MessageFeedback messageId={msg.id} currentModel={msg.model || undefined} />
                  )}
                </div>
              </div>
            ))}

            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-3xl bg-card border-l-4 border-blue-500 rounded-2xl p-6">
                  {streamingModel && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`text-sm font-semibold ${getProviderColor(streamingModel)}`}>
                        {getProviderLabel(streamingModel)}
                      </div>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{streamingMessage}</div>
                </div>
              </div>
            )}

            {streamError && (
              <div className="flex justify-center">
                <div className="max-w-3xl bg-destructive/10 border border-destructive rounded-2xl p-4 text-destructive">
                  <div className="font-semibold mb-1">Error</div>
                  <div className="text-sm">{streamError}</div>
                  <Button
                    data-testid="button-retry"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStreamError(null);
                      if (input) handleSend();
                    }}
                    className="mt-3"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              data-testid="input-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={isStreaming}
            />
            <Button
              data-testid="button-send"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
