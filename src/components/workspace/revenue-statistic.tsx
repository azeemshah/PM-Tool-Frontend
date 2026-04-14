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
import { analyticsApiService } from "@/api/analytics/services";

const RevenueStatistic = () => {
  const { workspace } = useAuthContext();
  const [timeframe, setTimeframe] = React.useState("monthly");

  const { data: cfdData, isLoading } = useQuery({
    queryKey: ["workspace-cfd", workspace?._id, timeframe],
    queryFn: () => analyticsApiService.getCFD(workspace?._id || "", timeframe),
    enabled: !!workspace?._id,
  });

  console.log("CFD Data from API:", cfdData);

  const statusKeys = React.useMemo(() => {
    const keys = new Set<string>();
    (cfdData || []).forEach((point: any) => {
      Object.keys(point || {}).forEach((key) => {
        if (key !== "name" && key !== "timestamp") {
          keys.add(key);
        }
      });
    });

    const preferredOrder = [
      "Backlog",
      "To Do",
      "In Progress",
      "In Review",
      "Blocked",
      "Done",
      "Closed",
    ];

    return Array.from(keys).sort((a, b) => {
      const ai = preferredOrder.indexOf(a);
      const bi = preferredOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [cfdData]);

  const currentStats = cfdData && cfdData.length > 0 ? cfdData[cfdData.length - 1] || {} : {};

  const totalTasks = statusKeys.reduce((acc, key) => {
    const val = (currentStats as any)[key];
    if (typeof val === "number") {
      return acc + val;
    }
    return acc;
  }, 0);

  if (isLoading) {
    return (
      <Card className="p-6 border-0 flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  const hasData = cfdData && cfdData.length > 0 && totalTasks > 0;

  const getStatusColor = (status: string, index: number) => {
    const map: Record<string, string> = {
      Backlog: "#94a3b8",
      "To Do": "#487fff",
      "In Progress": "#ff9f43",
      "In Review": "#8e44ad",
      Blocked: "#f97316",
      Done: "#10b981",
      Closed: "#64748b",
    };

    if (map[status]) return map[status];

    const palette = [
      "#0ea5e9",
      "#22c55e",
      "#a855f7",
      "#ec4899",
      "#facc15",
      "#4b5563",
    ];

    return palette[index % palette.length];
  };

  return (
    <Card className="p-6 md:p-7 rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h6 className="text-lg font-bold">Cumulative Flow Diagram</h6>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[120px] bg-background border-border/60 shadow-sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 mb-1 flex-wrap">
        {statusKeys.map((status, index) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor(status, index) }}
            />
            <span className="text-sm text-muted-foreground">
              {status}:{" "}
              <span className="font-bold text-foreground">
                {(currentStats as any)[status] || 0}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 h-[200px] md:h-[220px] flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cfdData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                {statusKeys.map((status, index) => {
                  const color = getStatusColor(status, index);
                  const gradientId = `cfdGradient-${index}`;
                  return (
                    <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  );
                })}
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
              {statusKeys.map((status, index) => {
                const color = getStatusColor(status, index);
                const gradientId = `cfdGradient-${index}`;
                return (
                  <Area
                    key={status}
                    type="monotone"
                    dataKey={status}
                    stackId="1"
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2}
                    dot={false}
                  />
                );
              })}
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
