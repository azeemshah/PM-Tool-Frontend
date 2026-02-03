import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  tagId?: string;
  onRemove?: (tagId: string) => void;
  variant?: "default" | "outline" | "soft";
  className?: string;
  removable?: boolean;
  color?: string;
}

const variantStyles = {
  default: "bg-blue-100 text-blue-900 border-blue-200",
  outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
  soft: "bg-gray-100 text-gray-800 border-gray-200",
};

const colorMap: Record<string, string> = {
  bug: "bg-red-100 text-red-900 border-red-200",
  feature: "bg-green-100 text-green-900 border-green-200",
  "tech-debt": "bg-yellow-100 text-yellow-900 border-yellow-200",
  "release-work": "bg-purple-100 text-purple-900 border-purple-200",
  documentation: "bg-blue-100 text-blue-900 border-blue-200",
  improvement: "bg-indigo-100 text-indigo-900 border-indigo-200",
  "performance": "bg-orange-100 text-orange-900 border-orange-200",
  "security": "bg-red-100 text-red-900 border-red-200",
};

export const TagBadge: React.FC<TagBadgeProps> = ({
  name,
  tagId,
  onRemove,
  variant = "default",
  className,
  removable = false,
  color,
}) => {
  const colorClass = color && colorMap[color.toLowerCase()] 
    ? colorMap[color.toLowerCase()] 
    : variantStyles[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
        colorClass,
        removable && "pr-1.5",
        className,
      )}
    >
      <span className="truncate max-w-xs">{name}</span>
      {removable && tagId && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tagId);
          }}
          className="ml-1 p-0.5 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
          title={`Remove ${name}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default TagBadge;
