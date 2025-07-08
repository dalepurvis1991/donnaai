import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Plus,
  ArrowLeft,
  CheckCheck,
  CircleDashed,
  Calendar,
  User,
  DollarSign
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  dueDate?: string;
  completedAt?: string;
  autoDetected: boolean;
  confidence?: number;
  supplier?: string;
  amount?: number;
  currency?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  stages?: {
    stage: string;
    completed: boolean;
    completedAt?: string;
    emailId?: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function Tasks() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["/api/tasks", selectedStatus === "all" ? undefined : selectedStatus],
    queryFn: () => apiRequest(`/api/tasks${selectedStatus !== "all" ? `?status=${selectedStatus}` : ""}`),
  });

  // Update task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      return apiRequest(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress": return <CircleDashed className="h-4 w-4 text-blue-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStageProgress = (stages: Task["stages"]) => {
    if (!stages || stages.length === 0) return 0;
    const completed = stages.filter(stage => stage.completed).length;
    return (completed / stages.length) * 100;
  };

  const markTaskComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        status: "completed",
        completedAt: new Date().toISOString()
      }
    });
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : 
                     task.status === "pending" ? "in_progress" :
                     task.status === "in_progress" ? "completed" : "pending";
    
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        status: newStatus,
        ...(newStatus === "completed" && { completedAt: new Date().toISOString() })
      }
    });
  };

  const statusCounts = tasks.reduce((acc: any, task: Task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Job Tracker</h1>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="text-lg">Loading tasks...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load tasks. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Job Tracker</h1>
            <Badge variant="secondary" className="text-sm">
              {tasks.length} total tasks
            </Badge>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => setSelectedStatus("all")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedStatus("pending")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedStatus("in_progress")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress || 0}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedStatus("completed")}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "pending", "in_progress", "completed"].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(status)}
              className="capitalize"
            >
              {status.replace("_", " ")}
            </Button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600">
                  {selectedStatus === "all" 
                    ? "Baron will automatically detect tasks from your emails. You can also create tasks manually."
                    : `No ${selectedStatus.replace("_", " ")} tasks at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task: Task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button 
                        onClick={() => toggleTaskStatus(task)}
                        className="mt-1"
                      >
                        {getStatusIcon(task.status)}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <Badge 
                            className={`text-xs text-white ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                          {task.autoDetected && (
                            <Badge variant="secondary" className="text-xs">
                              AI Detected {task.confidence && `(${Math.round(task.confidence * 100)}%)`}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        
                        {/* Business Details */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {task.supplier && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.supplier}
                            </div>
                          )}
                          {task.amount && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {task.currency || "GBP"} {task.amount.toFixed(2)}
                            </div>
                          )}
                          {task.orderNumber && (
                            <div className="text-xs">Order: {task.orderNumber}</div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                
                {task.stages && task.stages.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-600">
                          {task.stages.filter(s => s.completed).length}/{task.stages.length} stages
                        </span>
                      </div>
                      <Progress value={getStageProgress(task.stages)} className="h-2" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {task.stages.map((stage, index) => (
                          <div 
                            key={index}
                            className={`flex items-center gap-2 text-sm p-2 rounded ${
                              stage.completed ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {stage.completed ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-400" />
                            )}
                            <span>{stage.stage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}