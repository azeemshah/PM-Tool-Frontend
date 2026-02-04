import React, { useState, useEffect } from "react";
import { useTags } from "@/hooks/api/use-tags";
import { BarChart3, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagStat {
  _id: string;
  name: string;
  count: number;
  percentage: number;
}

interface TagStatisticsProps {
  workspaceId: string;
  workItems?: any[];
  compact?: boolean;
  className?: string;
  limit?: number;
}

export const TagStatistics: React.FC<TagStatisticsProps> = ({
  workspaceId,
  workItems = [],
  compact = false,
  className,
  limit = 10,
}) => {
  const { getAllTagsByWorkspace } = useTags();
  const [stats, setStats] = useState<TagStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const { data: tags, isLoading: isLoadingTags } =
    getAllTagsByWorkspace(workspaceId);

  useEffect(() => {
    if (tags && Array.isArray(tags)) {
      // Count tag occurrences in work items
      const tagCounts: Record<string, number> = {};
      const totalCount = workItems.length || 1;

      workItems.forEach((item) => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tag: any) => {
            const tagId = typeof tag === "string" ? tag : tag._id;
            tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
          });
        }
      });

      // Create statistics
      const statsData: TagStat[] = tags
        .map((tag: any) => ({
          _id: tag._id,
          name: tag.name,
          count: tagCounts[tag._id] || 0,
          percentage: ((tagCounts[tag._id] || 0) / totalCount) * 100,
        }))
        .filter((stat) => stat.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      setStats(statsData);
      setTotalItems(totalCount);
      setIsLoading(false);
    }
  }, [tags, workItems, limit]);

  if (isLoading || isLoadingTags) {
    return (
      <div className={cn("flex items-center justify-center py-4", className)}>
        <div className="text-sm text-muted-foreground">
          Loading tag statistics...
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 text-center",
          className,
        )}
      >
        <Tag className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No tags in use</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Tag Distribution</h3>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => {
          const barWidth = Math.max(20, stat.percentage); // minimum width for visibility

          return (
            <div key={stat._id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {stat.count}
                  {compact ? "" : ` (${stat.percentage.toFixed(1)}%)`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Total items: {totalItems}
        </div>
      )}
    </div>
  );
};

export default TagStatistics;
