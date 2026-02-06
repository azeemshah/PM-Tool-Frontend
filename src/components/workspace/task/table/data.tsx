import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import { transformOptions } from "@/lib/helper";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Circle,
  HelpCircle,
  Timer,
  View,
  AlertCircle,
  XCircle,
  User,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Shield,
  Flag,
  Bookmark,
  Tag,
  Hash,
  Zap,
  Activity,
  Target,
  Star,
  Box,
} from "lucide-react";
import { ISSUE_TYPES_LIST } from "@/components/issue/constants";

export const statusIcons = {
  [TaskStatusEnum.BACKLOG]: HelpCircle,
  [TaskStatusEnum.TO_DO]: Circle,
  [TaskStatusEnum.IN_PROGRESS]: Timer,
  [TaskStatusEnum.IN_REVIEW]: View,
  [TaskStatusEnum.BLOCKED]: AlertCircle,
  [TaskStatusEnum.DONE]: CheckCircle,
  [TaskStatusEnum.CLOSED]: XCircle,
};

const DYNAMIC_ICONS = [
  User,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Shield,
  Flag,
  Bookmark,
  Tag,
  Hash,
  Zap,
  Activity,
  Target,
  Star,
  Box,
];

export const getStatusIcon = (status: string) => {
  if (!status) return Circle;

  // Check exact match in statusIcons
  if (statusIcons[status]) return statusIcons[status];

  // Try normalized/lowercase match against known keys
  const knownStatus = Object.keys(statusIcons).find(
    k => k.toLowerCase() === status.toLowerCase()
  );
  if (knownStatus) return statusIcons[knownStatus];

  // If not found, use hash for dynamic icon
  const hash = status.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DYNAMIC_ICONS[hash % DYNAMIC_ICONS.length];
};

const priorityIcons = {
  [TaskPriorityEnum.LOW]: ArrowDown,
  [TaskPriorityEnum.MEDIUM]: ArrowRight,
  [TaskPriorityEnum.HIGH]: ArrowUp,
};

export const statuses = transformOptions(
  Object.values(TaskStatusEnum),
  statusIcons
);

export const priorities = transformOptions(
  Object.values(TaskPriorityEnum),
  priorityIcons
);

export const issueTypes = ISSUE_TYPES_LIST;



