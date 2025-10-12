import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Shield, BarChart3, MessageSquare, Users, TrendingUp, Sparkles } from "lucide-react";

interface AdminUser {
  isAdmin: boolean;
  [key: string]: any;
}

interface Analytics {
  totalUsers: number;
  totalConversations: number;
  totalFeedback: number;
  adminCount: number;
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [aiInput, setAiInput] = useState("");
  const [aiConversation, setAiConversation] = useState<Array<{ role: string; content: string }>>([]);

  const adminUser = user as AdminUser | undefined;

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!adminUser || !adminUser.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [adminUser, authLoading, toast]);

  // Fetch analytics
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: !!adminUser?.isAdmin,
  });

  // AI Assistant mutation
  const aiAssistantMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/admin/assistant", { message });
      return await res.json();
    },
    onSuccess: (data) => {
      setAiConversation(prev => [
        ...prev,
        { role: "user", content: aiInput },
        { role: "assistant", content: data.response }
      ]);
      setAiInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    },
  });

  const handleAiSubmit = () => {
    if (!aiInput.trim()) return;
    aiAssistantMutation.mutate(aiInput);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!adminUser?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Platform management & your private AI assistant
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Back to Platform
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalConversations || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Entries</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalFeedback || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.adminCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Private AI Assistant
            </CardTitle>
            <CardDescription>
              Ask questions about platform analytics, user management, or get recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {aiConversation.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your secret AI helper is ready!</p>
                  <p className="text-sm mt-2">Ask about analytics, moderation, or platform insights</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiConversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask your AI assistant anything about the platform..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSubmit();
                  }
                }}
                disabled={aiAssistantMutation.isPending}
                data-testid="input-admin-ai"
              />
              <Button
                onClick={handleAiSubmit}
                disabled={!aiInput.trim() || aiAssistantMutation.isPending}
                data-testid="button-admin-ai-send"
              >
                {aiAssistantMutation.isPending ? "Thinking..." : "Send"}
              </Button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>💡 Try asking:</strong> "How many users signed up today?" • "What's the most popular AI model?" • "Show me feedback trends"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Platform Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>AI Routing System</span>
                <span className="text-green-500 font-semibold">● Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>User Feedback Collection</span>
                <span className="text-green-500 font-semibold">● Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Database Connection</span>
                <span className="text-green-500 font-semibold">● Healthy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
