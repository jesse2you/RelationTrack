import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, GraduationCap, BookOpen, Search, CheckSquare, Sparkles, Plus, MessageSquare, CalendarDays, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const AGENTS = [
  {
    id: "learning_coach",
    name: "Learning Coach",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Help people learn new skills and concepts",
    model: "GPT-4o",
    capabilities: ["Learning guidance", "Personalized paths", "Concept explanation", "Practice exercises"],
    status: "active"
  },
  {
    id: "teaching_assistant",
    name: "Teaching Assistant",
    icon: GraduationCap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Create lessons and educational content",
    model: "GPT-4o-mini",
    capabilities: ["Lesson creation", "Tutorial design", "Curriculum building", "Content organization"],
    status: "active"
  },
  {
    id: "research_agent",
    name: "Research Agent",
    icon: Search,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Analyze information and provide insights",
    model: "O3-mini",
    capabilities: ["Data analysis", "Comparison", "Research synthesis", "Pattern recognition"],
    status: "active"
  },
  {
    id: "task_manager",
    name: "Task Manager",
    icon: CheckSquare,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Organize projects and tasks",
    model: "GPT-4o-mini",
    capabilities: ["Project planning", "Task creation", "Scheduling", "Workflow design"],
    status: "active"
  },
  {
    id: "coordinator",
    name: "Head Coordinator",
    icon: Sparkles,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Handle general queries and coordination",
    model: "GPT-4o-mini",
    capabilities: ["General assistance", "Query routing", "Agent coordination", "User support"],
    status: "active"
  }
];

export default function AgentDashboard() {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const { toast } = useToast();

  const handleAssignTask = () => {
    if (!selectedAgent || !taskTitle || !taskDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to assign a task.",
        variant: "destructive"
      });
      return;
    }

    const agent = AGENTS.find(a => a.id === selectedAgent);
    
    toast({
      title: "Task Assigned!",
      description: `Task "${taskTitle}" assigned to ${agent?.name} with ${taskPriority} priority.`
    });

    // Reset form
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setSelectedAgent("");
    setIsAssignModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Qwenticinicial
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.href = "/organization"}
            data-testid="button-organization"
            title="Organization"
          >
            <CalendarDays className="w-4 h-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Multi-Agent Orchestration
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and coordinate your specialized AI agents
          </p>
        </div>
        
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600" data-testid="button-assign-task">
              <Plus className="w-4 h-4 mr-2" />
              Assign Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]" data-testid="dialog-assign-task">
            <DialogHeader>
              <DialogTitle>Assign New Task</DialogTitle>
              <DialogDescription>
                Create a task and assign it to one of your AI agents
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger id="agent" data-testid="select-agent">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((agent) => {
                      const Icon = agent.icon;
                      return (
                        <SelectItem key={agent.id} value={agent.id} data-testid={`option-agent-${agent.id}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${agent.color}`} />
                            <span>{agent.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Help user learn Python basics"
                  data-testid="input-task-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Provide details about what the agent should do..."
                  rows={4}
                  data-testid="textarea-task-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger id="priority" data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} className="flex-1" data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleAssignTask} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600" data-testid="button-submit-task">
                  Assign Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="hover-elevate" data-testid={`card-agent-${agent.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${agent.bgColor}`}>
                    <Icon className={`w-6 h-6 ${agent.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{agent.name}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Model: {agent.model}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Army Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🤝 Agent Collaboration</h4>
              <p className="text-sm text-muted-foreground">
                Agents can consult each other mid-task for specialized expertise
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🧠 Shared Memory</h4>
              <p className="text-sm text-muted-foreground">
                All agents access the same knowledge base across conversations
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Smart Routing</h4>
              <p className="text-sm text-muted-foreground">
                Tasks automatically assigned to the best-suited agent
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">💰 Cost Optimized</h4>
              <p className="text-sm text-muted-foreground">
                Efficient model selection keeps costs under $10-20/month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
