import React from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/context/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { issueApiService } from "@/api/issue/services/issueApiService";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const TimeSpentEstimate = () => {
  const { workspace } = useAuthContext();
  const { theme } = useTheme();

  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["workspace-tasks-time-tracking", workspace?._id],
    queryFn: () => issueApiService.getTasksByWorkspace(workspace?._id || "", { limit: 5000 }),
    enabled: !!workspace?._id,
  });

  if (isLoading) {
    return (
      <Card className="p-6 border border-border/60 flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  const tasks = tasksData?.data || [];
  
  // Show all tasks from the workspace (unfiltered)
  const tasksWithTime = tasks;

  const categories = tasksWithTime.map((task: any) => task.title);
  
  const series = [
    {
      name: "Estimated Hours",
      data: tasksWithTime.map((task: any) => Math.round((Number(task.originalEstimate || 0) / 60) * 10) / 10),
    },
    {
      name: "Logged Hours",
      data: tasksWithTime.map((task: any) => Math.round((Number(task.timeSpent || 0) / 60) * 10) / 10),
    },
  ];

  // Dynamic width calculation for scrolling
  const minWidthPerItem = 100; // Increased for better spacing
  const totalMinWidth = tasksWithTime.length * minWidthPerItem;

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: true },
      fontFamily: "DM Sans, sans-serif",
      foreColor: "hsl(var(--muted-foreground))",
      background: 'transparent',
      // Allow the chart to take full container width
      width: '100%',
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%", // Narrower bars for many items
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    colors: ["#487FFF", "#10B981"], // Primary blue for estimate, Green for logged
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: "11px", // Slightly smaller font
          colors: "hsl(var(--muted-foreground))",
        },
        rotate: -45,
        trim: true,
        maxHeight: 120,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: "Hours",
        style: {
          color: "hsl(var(--muted-foreground))",
          fontWeight: 500,
        },
      },
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val) => `${val} hrs`,
      },
    },
    grid: {
      borderColor: "hsl(var(--border))",
      strokeDashArray: 4,
      padding: {
        left: 20,
        right: 20
      }
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: {
        colors: "hsl(var(--muted-foreground))",
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
  };

  return (
    <Card className="p-6 md:p-7 rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div>
          <h6 className="text-lg font-bold">Time Spent vs Estimate</h6>
          <p className="text-sm text-muted-foreground">
            Comparison of estimated hours vs actual logged time per work item
          </p>
        </div>
      </div>

      <div className="h-[450px] overflow-x-auto scrollbar pb-4">
        {tasksWithTime.length > 0 ? (
          <div style={{ minWidth: `${totalMinWidth}px`, width: '100%' }}>
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={400}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <p>No time tracking data available</p>
            <p className="text-xs italic text-center px-10">
              Tasks with original estimates or logged time will appear here.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TimeSpentEstimate;
