import {
    Target,
    BookOpen,
    CheckSquare,
    Bug as BugIcon,
    GitBranch,
    Lightbulb,
} from "lucide-react";
import { IssueType } from "@/api/issue/types";

export const ISSUE_TYPES_CONFIG: Record<IssueType, { label: string; icon: any; className: string }> = {
    epic: {
        label: "Epic",
        icon: Target,
        className: "bg-purple-100 text-purple-700",
    },
    story: {
        label: "Story",
        icon: BookOpen,
        className: "bg-green-100 text-green-700",
    },
    task: {
        label: "Task",
        icon: CheckSquare,
        className: "bg-blue-100 text-blue-700",
    },
    bug: {
        label: "Bug",
        icon: BugIcon,
        className: "bg-red-100 text-red-700",
    },
    improvement: {
        label: "Improvement",
        icon: Lightbulb,
        className: "bg-yellow-100 text-yellow-700",
    },
    subtask: {
        label: "Subtask",
        icon: GitBranch,
        className: "bg-gray-100 text-gray-700",
    },
};

export const ISSUE_TYPES_LIST = Object.entries(ISSUE_TYPES_CONFIG).map(([value, config]) => ({
    value: value as IssueType,
    ...config,
}));
