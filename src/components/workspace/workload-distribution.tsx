import React from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/context/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { getMembersInWorkspaceQueryFn } from "@/lib/api";
import { issueApiService } from "@/api/issue/services/issueApiService";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const WorkloadDistribution = () => {
  const { workspace } = useAuthContext();
  const { theme } = useTheme();

  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["members", workspace?._id],
    queryFn: () => getMembersInWorkspaceQueryFn(workspace?._id || ""),
    enabled: !!workspace?._id,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["workspace-tasks-all", workspace?._id],
    queryFn: () => issueApiService.getTasksByWorkspace(workspace?._id || "", { limit: 5000 }),
    enabled: !!workspace?._id,
  });

  if (membersLoading || tasksLoading) {
    return (
      <Card className="p-6 border border-border/60 flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  const members = membersData?.members || [];
  const tasks = tasksData?.data || [];

  // Process data for the graph
  const memberWorkload = members.map((member: any) => {
    // Extract User ID from member object - handle various possible structures
    const userObj = member.user || member.userId;
    const userId = typeof userObj === 'object' ? (userObj?._id || userObj?.id) : userObj;
    const userName = userObj?.name || 
                     (userObj?.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : null) || 
                     member.name || 
                     member.userName || 
                     "Unknown Member";

    if (!userId) return null;

    const memberTasks = tasks.filter((task: any) => {
      // Extract Assignee ID from task - handle various possible structures
      // We check assignedTo, assignee, and also fallback to reporter if no assignee is set
      // to match the logic used in the task table
      const assigneeData = task.assignedTo || task.assignee || task.reporter || task.assignedToId || task.assigneeId || task.reporterId;
      if (!assigneeData) return false;

      const taskAssigneeId = typeof assigneeData === 'object' 
        ? (assigneeData._id || assigneeData.id) 
        : assigneeData;

      return String(taskAssigneeId) === String(userId);
    });

    const tasksCount = memberTasks.length;
    const storyPoints = memberTasks.reduce((acc: number, task: any) => {
      const points = Number(task.storyPoints) || 0;
      const estimate = task.originalEstimate ? Number(task.originalEstimate) / 60 : 0;
      return acc + (points || estimate || 0);
    }, 0);

    return {
      name: userName,
      tasksCount,
      storyPoints: Math.round(storyPoints * 10) / 10,
    };
  }).filter(Boolean);

  // Calculate unassigned tasks
  const unassignedTasks = tasks.filter((task: any) => {
    const assigneeData = task.assignedTo || task.assignee || task.reporter || task.assignedToId || task.assigneeId || task.reporterId;
    return !assigneeData;
  });

  const workloadData = [...memberWorkload];
  
  if (unassignedTasks.length > 0) {
    const unassignedStoryPoints = unassignedTasks.reduce((acc: number, task: any) => {
      const points = Number(task.storyPoints) || 0;
      const estimate = task.originalEstimate ? Number(task.originalEstimate) / 60 : 0;
      return acc + (points || estimate || 0);
    }, 0);

    workloadData.push({
      name: "Unassigned",
      tasksCount: unassignedTasks.length,
      storyPoints: Math.round(unassignedStoryPoints * 10) / 10,
    });
  }

  const categories = workloadData.map((d) => d.name);
  const series = [
    {
      name: "Tasks Count",
      data: workloadData.map((d) => d.tasksCount),
    },
    {
      name: "Story Points / Hours",
      data: workloadData.map((d) => -d.storyPoints), // Negative to show below axis like Expenses
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "DM Sans, sans-serif",
      foreColor: "hsl(var(--muted-foreground))",
      stacked: true,
      background: 'transparent',
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    plotOptions: {
      bar: {
        columnWidth: "30%",
        borderRadius: 6,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "all",
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    colors: ["#487FFF", "#F97316"],
    grid: {
      borderColor: "hsl(var(--border))",
      strokeDashArray: 6,
      padding: { left: 8, right: 8 },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "12px",
      markers: { size: 8, strokeWidth: 0 },
      itemMargin: { horizontal: 10, vertical: 0 },
      labels: {
        colors: "hsl(var(--muted-foreground))",
      }
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { 
        style: { 
          fontSize: "12px",
          colors: "hsl(var(--muted-foreground))",
        },
        rotate: -45,
        trim: true,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
        },
        formatter: (val) => `${Math.abs(val)}`,
      },
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      style: {
        fontSize: '12px',
        fontFamily: "DM Sans, sans-serif",
      },
      y: {
        formatter: (val) => `${Math.abs(val)}`,
      },
    },
  };

  const totalTasks = tasks.length;
  const totalStoryPoints = Math.round(tasks.reduce((acc: number, task: any) => {
    const points = Number(task.storyPoints) || 0;
    const estimate = task.originalEstimate ? Number(task.originalEstimate) / 60 : 0;
    return acc + (points || estimate || 0);
  }, 0) * 10) / 10;

  return (
    <Card className="p-6 md:p-7 rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h6 className="text-lg font-bold">Workload Distribution</h6>
          <span className="text-sm text-muted-foreground">
            Team workload overview by tasks and story points
          </span>
        </div>
      </div>

      <div className="mt-6 mb-6 flex flex-wrap gap-10">
        <div>
          <span className="text-sm text-muted-foreground">Total Tasks</span>
          <div className="flex items-center gap-2 mt-1">
            <h6 className="text-2xl font-semibold">{totalTasks}</h6>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Total Story Points</span>
          <div className="flex items-center gap-2 mt-1">
            <h6 className="text-2xl font-semibold">{totalStoryPoints}</h6>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        {workloadData.length > 0 ? (
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={300}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No workload data available
          </div>
        )}
      </div>
    </Card>
  );
};

export default WorkloadDistribution;
