import React from "react";
import { Card } from "@/components/ui/card";
import {
  Bar,
  BarChart,
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
import { useQuery } from "@tanstack/react-query";
import { analyticsApiService } from "@/api/analytics/services";
import { useAuthContext } from "@/context/auth-provider";
import { Loader2 } from "lucide-react";

export const BalanceStatistic = () => {
  const { workspace } = useAuthContext();
  const [sprintsToShow, setSprintsToShow] = React.useState("10");

  const limit = Number(sprintsToShow) || 10;

  const { data: velocityData, isLoading } = useQuery({
    queryKey: ["workspace-velocity", workspace?._id, limit],
    queryFn: () => analyticsApiService.getVelocity(workspace?._id || "", limit),
    enabled: !!workspace?._id,
  });

  console.log('Velocity Data:', velocityData);

  // Calculate totals for the summary
  const totals = (velocityData || []).reduce(
    (acc, curr) => ({
      committed: acc.committed + curr.committed,
      completed: acc.completed + curr.completed,
    }),
    { committed: 0, completed: 0 }
  );

  // If no data, use some placeholder to maintain UI look or show empty state
  const chartData = velocityData && velocityData.length > 0 
    ? velocityData 
    : [
        { name: "Sprint 1", committed: 0, completed: 0 },
        { name: "Sprint 2", committed: 0, completed: 0 },
      ];

  if (isLoading) {
    return (
      <Card className="p-6 border-0 flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="p-6 border-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h6 className="text-lg font-bold">Velocity Chart</h6>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sprints</span>
          <Select value={sprintsToShow} onValueChange={setSprintsToShow}>
            <SelectTrigger className="h-8 w-[70px] bg-background border-border/60 shadow-sm">
              <SelectValue placeholder={sprintsToShow} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#487fff]" />
          <span className="text-sm text-muted-foreground">
            Committed: <span className="font-bold text-foreground">{totals.committed}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FFB020]" />
          <span className="text-sm text-muted-foreground">
            Completed: <span className="font-bold text-foreground">{totals.completed}</span>
          </span>
        </div>
      </div>

      <div className="mt-6 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" className="stroke-muted" />
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
            <Bar dataKey="committed" name="Committed" fill="#487fff" radius={[6, 6, 0, 0]} barSize={18} />
            <Bar dataKey="completed" name="Completed" fill="#FFB020" radius={[6, 6, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
