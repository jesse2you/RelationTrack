import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, GraduationCap, Search, CheckSquare, Sparkles, Play, Clock, CheckCircle2, XCircle, Loader2, ArrowRight, Globe, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const AGENT_ICONS = {
  coordinator: Sparkles,
  learning_coach: Brain,
  teaching_assistant: GraduationCap,
  research_agent: Search,
  task_manager: CheckSquare,
};

const AGENT_COLORS = {
  coordinator: "text-pink-500",
  learning_coach: "text-purple-500",
  teaching_assistant: "text-blue-500",
  research_agent: "text-green-500",
  task_manager: "text-orange-500",
};

export default function Orchestration() {
  const [userInput, setUserInput] = useState("");
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  const { toast } = useToast();

  const handleOrchestrate = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a request to orchestrate",
        variant: "destructive"
      });
      return;
    }

    setIsOrchestrating(true);
    setPlan(null);
    setResults([]);
    setFinalAnswer("");

    try {
      // Call Master Orchestrator
      const res = await apiRequest("POST", "/api/orchestrate", {
        message: userInput,
        userId: 'default_user',
        userTier: 'free'
      });

      const response = await res.json();

      if (response.success) {
        setPlan(response.plan);
        setResults(response.results);
        setFinalAnswer(response.finalAnswer);
        
        toast({
          title: "Orchestration Complete!",
          description: `Executed ${response.plan.executionSteps.length} steps successfully`
        });
      } else {
        throw new Error(response.error || 'Orchestration failed');
      }
    } catch (error: any) {
      toast({
        title: "Orchestration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsOrchestrating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Qwenticinicial Orchestrator
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.href = "/"}
            data-testid="button-home"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            n8n-Style Agent Orchestration
          </h1>
          <p className="text-muted-foreground mt-1">
            Watch the Master Orchestrator analyze, plan, and execute with specialist agents
          </p>
        </div>

        {/* Input Section */}
        <Card data-testid="card-orchestration-input">
          <CardHeader>
            <CardTitle>What would you like me to orchestrate?</CardTitle>
            <CardDescription>
              Describe your request and watch the Master Orchestrator coordinate specialist agents autonomously
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Example: Research the latest AI news, analyze the trends, and create a summary report for beginners..."
              rows={4}
              data-testid="textarea-orchestration-input"
            />
            <Button 
              onClick={handleOrchestrate}
              disabled={isOrchestrating}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              data-testid="button-orchestrate"
            >
              {isOrchestrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Orchestrating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Orchestration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Execution Plan Visualization */}
        {plan && (
          <Card data-testid="card-execution-plan">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Execution Plan
              </CardTitle>
              <CardDescription>
                Master Orchestrator created a {plan.executionSteps.length}-step plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Overview */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Primary: {plan.primaryAgent.replace('_', ' ')}
                </Badge>
                {plan.collaboratingAgents.length > 0 && (
                  <Badge variant="outline">
                    Collaborators: {plan.collaboratingAgents.join(', ')}
                  </Badge>
                )}
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {plan.estimatedDuration}
                </Badge>
              </div>

              {/* Execution Steps */}
              <div className="space-y-3">
                {plan.executionSteps.map((step: any, index: number) => {
                  const AgentIcon = AGENT_ICONS[step.agent as keyof typeof AGENT_ICONS] || Sparkles;
                  const agentColor = AGENT_COLORS[step.agent as keyof typeof AGENT_COLORS] || "text-gray-500";
                  const result = results[index];

                  return (
                    <div key={step.stepNumber} className="flex items-start gap-3 p-3 rounded-lg bg-muted" data-testid={`step-${step.stepNumber}`}>
                      <div className={`p-2 rounded-lg ${agentColor.replace('text', 'bg')}/10`}>
                        <AgentIcon className={`w-5 h-5 ${agentColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Step {step.stepNumber}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{step.agent.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{step.action}</p>
                        {step.toolsUsed.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {step.toolsUsed.map((tool: string) => (
                              <Badge key={tool} variant="secondary" className="text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {result && (
                          <div className="mt-2 p-2 rounded bg-background border">
                            <p className="text-xs font-semibold text-green-600 mb-1">✓ Completed</p>
                            <p className="text-sm">{result.output.substring(0, 150)}...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Answer */}
        {finalAnswer && (
          <Card data-testid="card-final-answer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Compiled Results
              </CardTitle>
              <CardDescription>
                All agents have completed their tasks. Here's the final answer:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p>{finalAnswer}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
