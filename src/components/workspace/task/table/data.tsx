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
  Target,
  BookOpen,
  CheckSquare,
  Bug as BugIcon,
  GitBranch,
} from "lucide-react";

const statusIcons = {
  [TaskStatusEnum.BACKLOG]: HelpCircle,
  [TaskStatusEnum.TODO]: Circle,
  [TaskStatusEnum.IN_PROGRESS]: Timer,
  [TaskStatusEnum.IN_REVIEW]: View,
  [TaskStatusEnum.DONE]: CheckCircle,
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

export const issueTypes = [
  {
    value: "epic",
    label: "Epic",
    icon: Target,
    className: "bg-purple-100 text-purple-700",
  },
  {
    value: "story",
    label: "Story",
    icon: BookOpen,
    className: "bg-green-100 text-green-700",
  },
  {
    value: "task",
    label: "Task",
    icon: CheckSquare,
    className: "bg-blue-100 text-blue-700",
  },
  {
    value: "bug",
    label: "Bug",
    icon: BugIcon,
    className: "bg-red-100 text-red-700",
  },
  {
    value: "subtask",
    label: "Subtask",
    icon: GitBranch,
    className: "bg-gray-100 text-gray-700",
  },
] as const;


