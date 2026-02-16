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
import { RefreshCw } from "lucide-react";

const WorkspaceDashboard = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const queryClient = useQueryClient();
  console.log('Dashboard render - workspace:', workspace?._id, 'loading:', workspaceLoading);

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
        <EnrollmentRateChart />
      </div>
      <div className="mt-6">
        <RevenueStatistic />
      </div>
      <div className="mt-6">
        <WorkloadDistribution />
      </div>
      <div className="mt-6">
        <TimeSpentEstimate />
      </div>
      {workspace?.boardType === "scrumboard" && (
        <div className="mt-6">
          <BalanceStatistic />
        </div>
      )}
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





