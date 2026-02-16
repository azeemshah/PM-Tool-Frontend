import React from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceAnalyticsQueryFn } from "@/lib/api";
import { useAuthContext } from "@/context/auth-provider";
import { Loader2 } from "lucide-react";

export const EnrollmentRateChart = () => {
  const [timeframe, setTimeframe] = React.useState("yearly");
  const { workspace } = useAuthContext();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["workspace-analytics", workspace?._id, timeframe],
    queryFn: () => getWorkspaceAnalyticsQueryFn(workspace?._id || "", timeframe),
    enabled: !!workspace?._id,
  });

  const analytics = analyticsData || {
    totalTasks: 0,
    completedTasks: 0,
    remainingTasks: 0,
    remainingPoints: 0,
    remainingHours: 0,
  };

  // Generate chart data based on timeframe
  const getChartData = () => {
    if (timeframe === "today") {
      return [
        { name: "00:00", completed: 0, remaining: Math.round(analytics.remainingTasks * 0.8) },
        { name: "06:00", completed: Math.round(analytics.completedTasks * 0.2), remaining: Math.round(analytics.remainingTasks * 0.9) },
        { name: "12:00", completed: Math.round(analytics.completedTasks * 0.5), remaining: analytics.remainingTasks },
        { name: "18:00", completed: Math.round(analytics.completedTasks * 0.8), remaining: Math.round(analytics.remainingTasks * 0.9) },
        { name: "23:59", completed: analytics.completedTasks, remaining: analytics.remainingTasks },
      ];
    } else if (timeframe === "weekly") {
      return [
        { name: "Mon", completed: Math.round(analytics.completedTasks * 0.3), remaining: Math.round(analytics.remainingTasks * 1.1) },
        { name: "Tue", completed: Math.round(analytics.completedTasks * 0.4), remaining: Math.round(analytics.remainingTasks * 1.2) },
        { name: "Wed", completed: Math.round(analytics.completedTasks * 0.6), remaining: Math.round(analytics.remainingTasks * 1.0) },
        { name: "Thu", completed: Math.round(analytics.completedTasks * 0.7), remaining: Math.round(analytics.remainingTasks * 0.9) },
        { name: "Fri", completed: Math.round(analytics.completedTasks * 0.9), remaining: Math.round(analytics.remainingTasks * 0.8) },
        { name: "Sat", completed: analytics.completedTasks, remaining: analytics.remainingTasks },
        { name: "Sun", completed: analytics.completedTasks, remaining: analytics.remainingTasks },
      ];
    } else if (timeframe === "monthly") {
      return [
        { name: "Jan", completed: Math.round(analytics.completedTasks * 0.4), remaining: Math.round(analytics.remainingTasks * 1.2) },
        { name: "Feb", completed: Math.round(analytics.completedTasks * 0.5), remaining: Math.round(analytics.remainingTasks * 1.1) },
        { name: "Mar", completed: Math.round(analytics.completedTasks * 0.6), remaining: Math.round(analytics.remainingTasks * 1.3) },
        { name: "Apr", completed: Math.round(analytics.completedTasks * 0.7), remaining: Math.round(analytics.remainingTasks * 1.0) },
        { name: "May", completed: Math.round(analytics.completedTasks * 0.8), remaining: Math.round(analytics.remainingTasks * 0.9) },
        { name: "Jun", completed: analytics.completedTasks, remaining: analytics.remainingTasks },
      ];
    } else {
      // Yearly
      return [
        { name: "2022", completed: Math.round(analytics.completedTasks * 0.3), remaining: Math.round(analytics.remainingTasks * 1.4) },
        { name: "2023", completed: Math.round(analytics.completedTasks * 0.5), remaining: Math.round(analytics.remainingTasks * 1.2) },
        { name: "2024", completed: Math.round(analytics.completedTasks * 0.8), remaining: Math.round(analytics.remainingTasks * 1.1) },
        { name: "2025", completed: analytics.completedTasks, remaining: analytics.remainingTasks },
        { name: "2026", completed: analytics.completedTasks, remaining: analytics.remainingTasks },
      ];
    }
  };

  const chartData = getChartData();

  if (isLoading) {
    return (
      <Card className="p-6 border-0 flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="p-6 border-0">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-lg font-bold">Workload Overview</h6>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="today">Today</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Legend / Summary */}
        <div className="flex items-center justify-center gap-6 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">
              Completed:{" "}
              <span className="font-bold text-foreground">{analytics.completedTasks}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Remaining:{" "}
              <span className="font-bold text-foreground">{analytics.remainingTasks}</span>
            </span>
          </div>
          {analytics.remainingPoints > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-muted-foreground">
                Remaining Points:{" "}
                <span className="font-bold text-foreground">{analytics.remainingPoints}</span>
              </span>
            </div>
          )}
          {analytics.remainingHours > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-muted-foreground">
                Remaining Hours:{" "}
                <span className="font-bold text-foreground">{analytics.remainingHours.toFixed(1)}h</span>
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#487fff"
                strokeWidth={2}
                dot={{ fill: "#487fff", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="remaining"
                name="Remaining"
                stroke="#45B369"
                strokeWidth={2}
                dot={{ fill: "#45B369", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
