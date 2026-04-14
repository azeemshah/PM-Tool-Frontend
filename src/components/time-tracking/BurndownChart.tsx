import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';
import { formatDuration } from '@/lib/helper';

interface BurndownDataPoint {
  date: string; // ISO date string
  remainingEstimate: number; // minutes
}

interface BurndownChartProps {
  data: BurndownDataPoint[];
  title?: string;
  height?: number;
}

/**
 * Simple SVG-based burndown chart
 * Shows remaining estimate over time with ideal and actual lines
 */
export function BurndownChart({
  data,
  title = 'Sprint Burndown',
  height = 300,
}: BurndownChartProps) {
  const padding = 40;
  const width = 800;
  const chartWidth = width - padding * 2;

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Sort by date
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get max value for scaling
    const maxRemaining = Math.max(...sorted.map((d) => d.remainingEstimate), 1);
    const minRemaining = Math.min(...sorted.map((d) => d.remainingEstimate), 0);

    // Calculate ideal line (linear burn from first to last)
    const firstValue = sorted[0].remainingEstimate;
    const lastValue = sorted[sorted.length - 1].remainingEstimate;
    const totalDays = sorted.length - 1;

    const dailyBurnRate = totalDays > 0 ? (firstValue - lastValue) / totalDays : 0;

    return {
      sorted,
      maxRemaining,
      minRemaining,
      dailyBurnRate,
      firstValue,
      lastValue,
    };
  }, [data]);

  if (!chartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No burndown data available</p>
        </CardContent>
      </Card>
    );
  }

  const { sorted, maxRemaining, dailyBurnRate, firstValue } = chartData;

  // Scale functions
  const scaleX = (index: number) => padding + (index / (sorted.length - 1 || 1)) * chartWidth;
  const scaleY = (value: number) => height - padding - ((value / maxRemaining) * (height - padding * 2));

  // Generate SVG points for actual line
  const actualPoints = sorted
    .map((d, i) => `${scaleX(i)},${scaleY(d.remainingEstimate)}`)
    .join(' ');

  // Generate SVG points for ideal line
  const idealPoints = sorted
    .map((_, i) => {
      const idealValue = Math.max(0, firstValue - dailyBurnRate * i);
      return `${scaleX(i)},${scaleY(idealValue)}`;
    })
    .join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height} className="w-full border border-gray-200 dark:border-border rounded">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <g key={`grid-${fraction}`}>
              {/* Horizontal grid */}
              <line
                x1={padding}
                y1={scaleY(maxRemaining * fraction)}
                x2={width - padding}
                y2={scaleY(maxRemaining * fraction)}
                stroke="#e5e7eb"
                strokeDasharray="4"
                className="dark:stroke-gray-700"
              />
            </g>
          ))}

          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth={2} />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth={2} />

          {/* Ideal line (dashed) */}
          <polyline
            points={idealPoints}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2}
            strokeDasharray="6"
            opacity={0.6}
          />

          {/* Actual line (solid) */}
          <polyline
            points={actualPoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {sorted.map((d, i) => (
            <circle
              key={`point-${i}`}
              cx={scaleX(i)}
              cy={scaleY(d.remainingEstimate)}
              r={3}
              fill="#3b82f6"
              opacity={0.8}
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = Math.round(maxRemaining * fraction);
            const label = formatDuration(value);
            return (
              <g key={`y-label-${fraction}`}>
                <text
                  x={padding - 8}
                  y={scaleY(value) + 4}
                  fontSize="12"
                  textAnchor="end"
                  className="fill-gray-600 dark:fill-gray-400"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X-axis labels (sample days) */}
          {sorted.map((d, i) => {
            // Show every nth label to avoid clustering
            const step = Math.max(1, Math.floor(sorted.length / 5));
            if (i % step !== 0 && i !== sorted.length - 1) return null;

            const date = new Date(d.date);
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <g key={`x-label-${i}`}>
                <text
                  x={scaleX(i)}
                  y={height - padding + 20}
                  fontSize="12"
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-400"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-yellow-400" style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24 50%, transparent 50%)', backgroundSize: '6px 1px' }} />
            <span className="text-gray-600 dark:text-gray-400">Ideal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
