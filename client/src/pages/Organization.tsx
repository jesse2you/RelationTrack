import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Clock, Plus, Trash2, Calendar, Users } from "lucide-react";
import type { Task, Meeting, Schedule } from "@shared/schema";
import { format } from "date-fns";

export default function Organization() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tasks");
  
  // Dialog states
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  // Form states
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "pending", priority: "medium", dueDate: "" });
  const [meetingForm, setMeetingForm] = useState({ title: "", notes: "", participants: "", meetingDate: "", duration: "" });
  const [scheduleForm, setScheduleForm] = useState({ title: "", description: "", scheduledTime: "", recurrence: "once", isActive: true });

  // Queries
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: meetings = [] } = useQuery<Meeting[]>({ queryKey: ["/api/meetings"] });
  const { data: schedules = [] } = useQuery<Schedule[]>({ queryKey: ["/api/schedules"] });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/tasks", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowTaskDialog(false);
      setTaskForm({ title: "", description: "", status: "pending", priority: "medium", dueDate: "" });
      toast({ title: "Task created successfully" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/tasks/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tasks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/meetings", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setShowMeetingDialog(false);
      setMeetingForm({ title: "", notes: "", participants: "", meetingDate: "", duration: "" });
      toast({ title: "Meeting created successfully" });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/meetings/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: "Meeting deleted" });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/schedules", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowScheduleDialog(false);
      setScheduleForm({ title: "", description: "", scheduledTime: "", recurrence: "once", isActive: true });
      toast({ title: "Schedule created successfully" });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/schedules/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Schedule deleted" });
    },
  });

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const getStatusIcon = (status: string) => {
    return status === "completed" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="h-screen relative">
      {/* Purple Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-500 dark:from-purple-800 dark:via-pink-800 dark:to-cyan-800" />
      <div className="absolute inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 h-full overflow-auto p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
            MeetingMate Organization
          </h1>
          <p className="text-muted-foreground mt-2">Manage your tasks, meetings, and schedules</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
            <TabsTrigger value="meetings" data-testid="tab-meetings">Meetings</TabsTrigger>
            <TabsTrigger value="schedules" data-testid="tab-schedules">Schedules</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Task List</h2>
              <Button onClick={() => setShowTaskDialog(true)} data-testid="button-add-task">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card key={task.id} data-testid={`card-task-${task.id}`} className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleTaskStatus(task)} data-testid={`button-toggle-task-${task.id}`}>
                        {getStatusIcon(task.status)}
                      </button>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant={getPriorityColor(task.priority || "medium")}>
                            {task.priority || "medium"}
                          </Badge>
                          {task.dueDate && (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        data-testid={`button-delete-task-${task.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No tasks yet. Create your first task to get started!
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Meetings</h2>
              <Button onClick={() => setShowMeetingDialog(true)} data-testid="button-add-meeting">
                <Plus className="w-4 h-4 mr-2" />
                Add Meeting
              </Button>
            </div>

            <div className="grid gap-4">
              {meetings.map((meeting) => (
                <Card key={meeting.id} data-testid={`card-meeting-${meeting.id}`} className="hover-elevate">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{meeting.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(meeting.meetingDate), "PPP 'at' p")}
                          {meeting.duration && ` • ${meeting.duration}`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMeetingMutation.mutate(meeting.id)}
                        data-testid={`button-delete-meeting-${meeting.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {(meeting.notes || meeting.participants?.length) && (
                    <CardContent>
                      {meeting.participants && meeting.participants.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {meeting.participants.join(", ")}
                          </p>
                        </div>
                      )}
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
              {meetings.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No meetings scheduled. Add your first meeting!
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Schedules</h2>
              <Button onClick={() => setShowScheduleDialog(true)} data-testid="button-add-schedule">
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </div>

            <div className="grid gap-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id} data-testid={`card-schedule-${schedule.id}`} className="hover-elevate">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {schedule.title}
                          {schedule.isActive && <Badge variant="default">Active</Badge>}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(schedule.scheduledTime), "PPP 'at' p")}
                          {schedule.recurrence && ` • ${schedule.recurrence}`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                        data-testid={`button-delete-schedule-${schedule.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {schedule.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{schedule.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
              {schedules.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No schedules yet. Create your first schedule!
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent data-testid="dialog-create-task">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a task to your to-do list</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                data-testid="input-task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                data-testid="input-task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Task description (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
                  <SelectTrigger id="task-priority" data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  data-testid="input-task-due-date"
                  type="datetime-local"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTaskDialog(false)} variant="outline" data-testid="button-cancel-task">
              Cancel
            </Button>
            <Button
              onClick={() => createTaskMutation.mutate({
                ...taskForm,
                dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
              })}
              disabled={!taskForm.title}
              data-testid="button-create-task"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent data-testid="dialog-create-meeting">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>Add a meeting to your calendar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-title">Title</Label>
              <Input
                id="meeting-title"
                data-testid="input-meeting-title"
                value={meetingForm.title}
                onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                placeholder="Meeting title"
              />
            </div>
            <div>
              <Label htmlFor="meeting-date">Date & Time</Label>
              <Input
                id="meeting-date"
                data-testid="input-meeting-date"
                type="datetime-local"
                value={meetingForm.meetingDate}
                onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="meeting-duration">Duration</Label>
              <Input
                id="meeting-duration"
                data-testid="input-meeting-duration"
                value={meetingForm.duration}
                onChange={(e) => setMeetingForm({ ...meetingForm, duration: e.target.value })}
                placeholder="e.g., 30 minutes, 1 hour"
              />
            </div>
            <div>
              <Label htmlFor="meeting-participants">Participants (comma-separated)</Label>
              <Input
                id="meeting-participants"
                data-testid="input-meeting-participants"
                value={meetingForm.participants}
                onChange={(e) => setMeetingForm({ ...meetingForm, participants: e.target.value })}
                placeholder="john@example.com, jane@example.com"
              />
            </div>
            <div>
              <Label htmlFor="meeting-notes">Notes</Label>
              <Textarea
                id="meeting-notes"
                data-testid="input-meeting-notes"
                value={meetingForm.notes}
                onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                placeholder="Meeting notes (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMeetingDialog(false)} variant="outline" data-testid="button-cancel-meeting">
              Cancel
            </Button>
            <Button
              onClick={() => createMeetingMutation.mutate({
                title: meetingForm.title,
                notes: meetingForm.notes,
                meetingDate: new Date(meetingForm.meetingDate).toISOString(),
                duration: meetingForm.duration,
                participants: meetingForm.participants 
                  ? meetingForm.participants.split(",").map(p => p.trim()).filter(p => p.length > 0)
                  : [],
              })}
              disabled={!meetingForm.title || !meetingForm.meetingDate}
              data-testid="button-create-meeting"
            >
              Create Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent data-testid="dialog-create-schedule">
          <DialogHeader>
            <DialogTitle>Create Schedule</DialogTitle>
            <DialogDescription>Set up a recurring schedule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-title">Title</Label>
              <Input
                id="schedule-title"
                data-testid="input-schedule-title"
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                placeholder="Schedule title"
              />
            </div>
            <div>
              <Label htmlFor="schedule-time">Scheduled Time</Label>
              <Input
                id="schedule-time"
                data-testid="input-schedule-time"
                type="datetime-local"
                value={scheduleForm.scheduledTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="schedule-recurrence">Recurrence</Label>
              <Select value={scheduleForm.recurrence} onValueChange={(value) => setScheduleForm({ ...scheduleForm, recurrence: value })}>
                <SelectTrigger id="schedule-recurrence" data-testid="select-schedule-recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="schedule-description">Description</Label>
              <Textarea
                id="schedule-description"
                data-testid="input-schedule-description"
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                placeholder="Schedule description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowScheduleDialog(false)} variant="outline" data-testid="button-cancel-schedule">
              Cancel
            </Button>
            <Button
              onClick={() => createScheduleMutation.mutate({
                ...scheduleForm,
                scheduledTime: new Date(scheduleForm.scheduledTime).toISOString(),
              })}
              disabled={!scheduleForm.title || !scheduleForm.scheduledTime}
              data-testid="button-create-schedule"
            >
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
