import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, GraduationCap, Search, CheckSquare, Sparkles, Play, Clock, CheckCircle2, Loader2, ArrowRight, Globe, MessageSquare, Activity, Zap, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AGENTS = [
  {
    id: "coordinator",
    name: "Head Coordinator",
    icon: Sparkles,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Master orchestrator",
  },
  {
    id: "learning_coach",
    name: "Learning Coach",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Educational guidance",
  },
  {
    id: "research_agent",
    name: "Research Agent",
    icon: Search,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Analysis & insights",
  },
  {
    id: "task_manager",
    name: "Task Manager",
    icon: CheckSquare,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Organization & planning",
  },
  {
    id: "teaching_assistant",
    name: "Teaching Assistant",
    icon: GraduationCap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Content creation",
  },
];

export default function Orchestration() {
  const [userInput, setUserInput] = useState("");
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
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
    setActiveAgents([]);
    setCurrentStep(0);
    setStatusMessage("Initializing orchestration...");

    try {
      // Create SSE connection for real-time streaming
      const response = await fetch("/api/orchestrate/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          userId: 'default_user',
          userTier: 'free'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            
            if (data === "[DONE]") {
              continue;
            }

            try {
              const event = JSON.parse(data);
              
              // Handle different event types
              switch (event.type) {
                case 'start':
                  setStatusMessage("Orchestration started");
                  break;
                  
                case 'status':
                  setStatusMessage(event.message);
                  break;
                  
                case 'plan':
                  setPlan(event.plan);
                  setStatusMessage(`Plan created: ${event.plan.executionSteps.length} steps`);
                  break;
                  
                case 'step_start':
                  setCurrentStep(event.stepNumber);
                  setActiveAgents([event.agent]);
                  setStatusMessage(`Step ${event.stepNumber}: ${event.action}`);
                  break;
                  
                case 'step_complete':
                  setResults(prev => [...prev, event.result]);
                  setActiveAgents([]);
                  break;
                  
                case 'step_error':
                  toast({
                    title: `Step ${event.stepNumber} Error`,
                    description: event.error,
                    variant: "destructive"
                  });
                  break;
                  
                case 'complete':
                  setFinalAnswer(event.finalAnswer);
                  setStatusMessage("Orchestration complete!");
                  setActiveAgents([]);
                  toast({
                    title: "Orchestration Complete!",
                    description: `Successfully executed ${event.plan.executionSteps.length} steps`
                  });
                  break;
                  
                case 'error':
                  throw new Error(event.error);
                  
                case 'done':
                  break;
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError);
            }
          }
        }
      }

    } catch (error: any) {
      toast({
        title: "Orchestration Failed",
        description: error.message,
        variant: "destructive"
      });
      setStatusMessage("Orchestration failed");
    } finally {
      setIsOrchestrating(false);
      setActiveAgents([]);
    }
  };

  const getAgentStatus = (agentId: string) => {
    if (activeAgents.includes(agentId)) return "active";
    if (plan && plan.executionSteps.some((s: any) => s.agent === agentId)) return "idle";
    return "idle";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Orchestrator</h1>
            <p className="text-xs text-muted-foreground">n8n-Style Autonomous Execution</p>
          </div>
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
        {/* Status Bar */}
        {isOrchestrating && (
          <Card className="border-purple-500/50 bg-purple-50 dark:bg-purple-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                <p className="font-medium text-purple-900 dark:text-purple-100">{statusMessage}</p>
                {currentStep > 0 && plan && (
                  <Badge variant="secondary" className="ml-auto">
                    Step {currentStep} of {plan.executionSteps.length}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Status Cards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Agent Army Status</h2>
            {isOrchestrating && (
              <Badge variant="outline" className="ml-auto">
                <Activity className="w-3 h-3 mr-1 animate-pulse" />
                Orchestrating...
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {AGENTS.map((agent) => {
              const status = getAgentStatus(agent.id);
              const Icon = agent.icon;
              
              return (
                <Card 
                  key={agent.id} 
                  className={cn(
                    "transition-all duration-300",
                    status === "active" && "ring-2 ring-purple-500 shadow-lg scale-105"
                  )}
                  data-testid={`agent-card-${agent.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={cn(
                        "p-3 rounded-full transition-all duration-300",
                        status === "active" ? "bg-gradient-to-br from-purple-500 to-pink-500" : agent.bgColor
                      )}>
                        <Icon className={cn(
                          "w-6 h-6 transition-all duration-300",
                          status === "active" ? "text-white animate-pulse" : agent.color
                        )} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                      <Badge 
                        variant={status === "active" ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          status === "active" && "bg-purple-600 animate-pulse"
                        )}
                      >
                        {status === "active" ? (
                          <>
                            <Zap className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          "Idle"
                        )}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Input Section */}
        <Card data-testid="card-orchestration-input">
          <CardHeader>
            <CardTitle>What would you like me to orchestrate?</CardTitle>
            <CardDescription>
              Describe your request and watch the Master Orchestrator coordinate specialist agents autonomously in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Example: Research the latest AI trends, analyze them, and create a beginner-friendly summary..."
              rows={4}
              data-testid="textarea-orchestration-input"
              disabled={isOrchestrating}
            />
            <Button 
              onClick={handleOrchestrate}
              disabled={isOrchestrating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

        {/* Execution Timeline */}
        {plan && (
          <Card data-testid="card-execution-plan">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Execution Timeline
              </CardTitle>
              <CardDescription>
                {isOrchestrating 
                  ? `Processing step ${currentStep} of ${plan.executionSteps.length}...`
                  : `Master Orchestrator executed ${plan.executionSteps.length} steps`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Overview */}
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted">
                <Badge variant="outline">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Primary: {plan.primaryAgent.replace('_', ' ')}
                </Badge>
                {plan.collaboratingAgents.length > 0 && (
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    +{plan.collaboratingAgents.length} Collaborators
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
                  const agent = AGENTS.find(a => a.id === step.agent);
                  const AgentIcon = agent?.icon || Sparkles;
                  const agentColor = agent?.color || "text-gray-500";
                  const bgColor = agent?.bgColor || "bg-gray-500/10";
                  const result = results[index];
                  const isActive = currentStep === index + 1 && isOrchestrating;
                  const isCompleted = index < results.length;

                  return (
                    <div 
                      key={step.stepNumber} 
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border transition-all duration-300",
                        isActive && "ring-2 ring-purple-500 shadow-lg bg-purple-50 dark:bg-purple-950/20",
                        isCompleted && "bg-green-50 dark:bg-green-950/20",
                        !isActive && !isCompleted && "bg-muted"
                      )}
                      data-testid={`step-${step.stepNumber}`}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        isActive ? "bg-gradient-to-br from-purple-500 to-pink-500" : bgColor
                      )}>
                        <AgentIcon className={cn(
                          "w-5 h-5 transition-all duration-300",
                          isActive ? "text-white animate-pulse" : agentColor
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Step {step.stepNumber}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{agent?.name || step.agent}</span>
                          {isActive && (
                            <Badge className="ml-auto bg-purple-600 animate-pulse">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Working...
                            </Badge>
                          )}
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{step.action}</p>
                        {step.toolsUsed && step.toolsUsed.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-2">
                            {step.toolsUsed.map((tool: string) => (
                              <Badge key={tool} variant="secondary" className="text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {result && (
                          <div className="mt-2 p-3 rounded bg-background border border-green-500/50">
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </p>
                            <p className="text-sm line-clamp-3">{result.output}</p>
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
          <Card data-testid="card-final-answer" className="border-green-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Orchestration Complete
              </CardTitle>
              <CardDescription>
                All {plan.executionSteps.length} agents completed their tasks. Here's the compiled result:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{finalAnswer}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        {!plan && !isOrchestrating && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-500/50" />
              <p className="font-medium">Ready to orchestrate your AI army</p>
              <p className="text-sm mt-1">Enter a request above and watch specialist agents work autonomously in real-time</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
