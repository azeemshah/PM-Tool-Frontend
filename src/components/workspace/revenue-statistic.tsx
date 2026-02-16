import React from "react";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/context/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaceCFDQueryFn } from "@/lib/api";

const RevenueStatistic = () => {
  const { workspace } = useAuthContext();
  const [timeframe, setTimeframe] = React.useState("yearly");

  const { data: cfdData, isLoading } = useQuery({
    queryKey: ["workspace-cfd", workspace?._id, timeframe],
    queryFn: () => getWorkspaceCFDQueryFn(workspace?._id || "", timeframe),
    enabled: !!workspace?._id,
  });

  console.log("CFD Data from API:", cfdData);

  // Get current totals from the last data point
  const currentStats = cfdData && cfdData.length > 0 
    ? cfdData[cfdData.length - 1] 
    : { "Backlog": 0, "To Do": 0, "In Progress": 0, "In Review": 0, "Done": 0 };

  const totalTasks = Object.values(currentStats).reduce((acc: number, val: any) => 
    typeof val === 'number' ? acc + val : acc, 0
  ) as number;

  if (isLoading) {
    return (
      <Card className="p-6 border-0 flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  // Ensure data exists and has points to show
  const hasData = cfdData && cfdData.length > 0 && totalTasks > 0;

  return (
    <Card className="p-6 md:p-7 rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h6 className="text-lg font-bold">Cumulative Flow Diagram</h6>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[120px] bg-background border-border/60 shadow-sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#94a3b8]" />
          <span className="text-sm text-muted-foreground">
            Backlog: <span className="font-bold text-foreground">{currentStats["Backlog"] || 0}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#487fff]" />
          <span className="text-sm text-muted-foreground">
            To Do: <span className="font-bold text-foreground">{currentStats["To Do"] || 0}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff9f43]" />
          <span className="text-sm text-muted-foreground">
            In Progress: <span className="font-bold text-foreground">{currentStats["In Progress"]}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#8e44ad]" />
          <span className="text-sm text-muted-foreground">
            In Review: <span className="font-bold text-foreground">{currentStats["In Review"]}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10b981]" />
          <span className="text-sm text-muted-foreground">
            Done: <span className="font-bold text-foreground">{currentStats["Done"]}</span>
          </span>
        </div>
      </div>

      <div className="mt-5 h-[200px] md:h-[220px] flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cfdData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="backlogGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="todoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#487fff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#487fff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff9f43" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ff9f43" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8e44ad" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8e44ad" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="doneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 8" className="stroke-muted/60" />
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
              <Area
                type="monotone"
                dataKey="Backlog"
                stackId="1"
                stroke="#94a3b8"
                fill="url(#backlogGradient)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="To Do"
                stackId="1"
                stroke="#487fff"
                fill="url(#todoGradient)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="In Progress"
                stackId="1"
                stroke="#ff9f43"
                fill="url(#progressGradient)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="In Review"
                stackId="1"
                stroke="#8e44ad"
                fill="url(#reviewGradient)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="Done"
                stackId="1"
                stroke="#10b981"
                fill="url(#doneGradient)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
            <p>No task data available for the selected timeframe.</p>
            <p className="text-xs italic">Create some tasks to see the flow!</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RevenueStatistic;
