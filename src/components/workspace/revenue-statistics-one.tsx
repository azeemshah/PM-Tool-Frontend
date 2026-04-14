import React from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RevenueStatisticsOne = () => {
  const [timeframe, setTimeframe] = React.useState("yearly");

  const categories = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  const series = [
    {
      name: "Income",
      data: [32, 28, 36, 48, 35, 32, 42, 28, 30, 38, 52, 36, 34, 44],
    },
    {
      name: "Expenses",
      data: [-18, -14, -20, -30, -16, -22, -35, -18, -15, -20, -32, -18, -24, -34],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "DM Sans, sans-serif",
      foreColor: "hsl(var(--muted-foreground))",
    },
    plotOptions: {
      bar: {
        columnWidth: "28%",
        borderRadius: 6,
        borderRadiusApplication: "end",
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
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "12px" } },
    },
    yaxis: {
      min: -60,
      max: 60,
      tickAmount: 4,
      labels: {
        formatter: (val) => `${Math.abs(val)}`,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `$${Math.abs(val).toLocaleString()}`,
      },
    },
  };

  return (
    <Card className="p-6 md:p-7 rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h6 className="text-lg font-bold">Revenue Statistics</h6>
          <span className="text-sm text-muted-foreground">
            Yearly earning overview
          </span>
        </div>
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

      <div className="mt-6 mb-6 flex flex-wrap gap-10">
        <div>
          <span className="text-sm text-muted-foreground">Income</span>
          <div className="flex items-center gap-2 mt-1">
            <h6 className="text-2xl font-semibold">$26,201</h6>
            <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
              10%
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Expenses</span>
          <div className="flex items-center gap-2 mt-1">
            <h6 className="text-2xl font-semibold">$18,120</h6>
            <span className="text-orange-600 text-sm font-semibold flex items-center gap-1">
              10%
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="h-[260px]">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={260}
        />
      </div>
    </Card>
  );
};

export default RevenueStatisticsOne;
