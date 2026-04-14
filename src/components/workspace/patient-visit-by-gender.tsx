import React from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";

const PatientVisitByGender = () => {
  const { theme } = useTheme();

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const categories = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

  const series = [
    {
      name: "Male",
      data: [60, 120, 60, 90, 50, 95, 90],
    },
    {
      name: "Female",
      data: [45, 100, 40, 55, 30, 58, 50],
    },
  ];

  const totalMale = series[0].data.reduce((acc, v) => acc + v, 0);
  const totalFemale = series[1].data.reduce((acc, v) => acc + v, 0);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "DM Sans, sans-serif",
      foreColor: "hsl(var(--muted-foreground))",
      background: "transparent",
    },
    theme: {
      mode: isDarkMode ? "dark" : "light",
    },
    plotOptions: {
      bar: {
        columnWidth: "30%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    colors: ["#F59E0B", "#22C55E"],
    grid: {
      borderColor: "hsl(var(--border))",
      strokeDashArray: 6,
      padding: { left: 8, right: 8 },
    },
    legend: { show: false },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: "12px",
          colors: "hsl(var(--muted-foreground))",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "hsl(var(--muted-foreground))",
        },
      },
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      style: {
        fontSize: "12px",
        fontFamily: "DM Sans, sans-serif",
      },
    },
  };

  return (
    <Card className="p-6 md:p-7 rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h6 className="text-lg font-bold">Patient Visit By Gender</h6>
        <Select defaultValue="month">
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="This Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-4 rounded-full bg-amber-500" />
          <span className="text-sm text-muted-foreground font-semibold">
            Male: <span className="text-foreground font-bold">{totalMale}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-4 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground font-semibold">
            Female: <span className="text-foreground font-bold">{totalFemale}</span>
          </span>
        </div>
      </div>

      <div className="mt-6 h-[260px]">
        <ReactApexChart options={options} series={series} type="bar" height={260} />
      </div>
    </Card>
  );
};

export default PatientVisitByGender;
