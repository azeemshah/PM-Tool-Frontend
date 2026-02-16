import { useState } from "react";
import { Button } from "@/components/ui/button";
import WorkspaceAnalytics from "@/components/workspace/workspace-analytics";
import { TimeTrackingDashboard } from "@/components/time-tracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentTasks from "@/components/workspace/task/recent-tasks";
import RecentMembers from "@/components/workspace/member/recent-members";
import { EnrollmentRateChart } from "@/components/workspace/enrollment-rate-chart";
import { BalanceStatistic } from "@/components/workspace/balance-statistic";
import RevenueStatistic from "@/components/workspace/revenue-statistic";
import WorkloadDistribution from "@/components/workspace/workload-distribution";
import TimeSpentEstimate from "@/components/workspace/time-spent-estimate";
import { useAuthContext } from "@/context/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { AreaChart, BarChart3, BarChartHorizontal, Gauge, LineChart, RefreshCw } from "lucide-react";

const WorkspaceDashboard = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const queryClient = useQueryClient();
  console.log('Dashboard render - workspace:', workspace?._id, 'loading:', workspaceLoading);

  const [activeChart, setActiveChart] = useState<
    "workloadOverview" | "cumulativeFlow" | "workloadDistribution" | "timeSpentEstimate" | "velocity"
  >("workloadOverview");

  const isScrumboard = workspace?.boardType === "scrumboard";

  const charts = [
    {
      id: "workloadOverview" as const,
      label: "Workload Overview",
      icon: LineChart,
    },
    {
      id: "cumulativeFlow" as const,
      label: "Cumulative Flow Diagram",
      icon: AreaChart,
    },
    {
      id: "workloadDistribution" as const,
      label: "Workload Distribution",
      icon: BarChart3,
    },
    {
      id: "timeSpentEstimate" as const,
      label: "Time Spent vs Estimate",
      icon: BarChartHorizontal,
    },
    ...(isScrumboard
      ? [
        {
          id: "velocity" as const,
          label: "Velocity",
          icon: Gauge,
        },
      ]
      : []),
  ];

  const availableIds = charts.map((chart) => chart.id);
  const currentChartId = availableIds.includes(activeChart as any) ? activeChart : charts[0]?.id;
  const currentChart = charts.find((chart) => chart.id === currentChartId) ?? charts[0];

  return (
    <main className="flex flex-1 flex-col py-4 md:pt-3">
      <div className="space-y-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Project Overview
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s an overview for this project!
          </p>
        </div>
      </div>
      <WorkspaceAnalytics />
      <div className="mt-6">
        <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chart type
            </span>
            <span className="text-sm font-medium text-foreground">
              {currentChart?.label}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-muted px-1 py-1">
            {charts.map((chart) => {
              const Icon = chart.icon;
              const isActive = chart.id === currentChartId;
              return (
                <button
                  key={chart.id}
                  type="button"
                  onClick={() => setActiveChart(chart.id)}
                  className={
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border text-muted-foreground transition " +
                    (isActive
                      ? "bg-background text-primary border-primary shadow-sm"
                      : "bg-muted hover:bg-background")
                  }
                  aria-label={chart.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4">
          {currentChartId === "workloadOverview" && <EnrollmentRateChart />}
          {currentChartId === "cumulativeFlow" && <RevenueStatistic />}
          {currentChartId === "workloadDistribution" && <WorkloadDistribution />}
          {currentChartId === "timeSpentEstimate" && <TimeSpentEstimate />}
          {currentChartId === "velocity" && isScrumboard && <BalanceStatistic />}
        </div>
      </div>
      <div className="mt-6">
        <TimeTrackingDashboard workspaceId={workspace?._id || ''} />
      </div>
      <div className="mt-4">
        <Tabs defaultValue="tasks" className="w-full border rounded-lg p-2 bg-card">
          <TabsList className="w-full justify-between border-0 bg-muted px-1 h-12">
            <div className="flex items-center">
              <TabsTrigger className="py-2 data-[state=active]:bg-background data-[state=active]:text-foreground" value="tasks">
                Recent Tasks
              </TabsTrigger>
              <TabsTrigger className="py-2 data-[state=active]:bg-background data-[state=active]:text-foreground" value="members">
                Recent Members
              </TabsTrigger>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["recent-tasks", workspace?._id] })}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </TabsList>
          <TabsContent value="tasks">
            <RecentTasks />
          </TabsContent>
          <TabsContent value="members">
            <RecentMembers />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default WorkspaceDashboard;





