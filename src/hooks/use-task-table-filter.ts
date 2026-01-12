import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

const useTaskTableFilter = () => {
  return useQueryStates({
    status: parseAsStringEnum<TaskStatusEnumType>(
      Object.values(TaskStatusEnum)
    ),
    priority: parseAsStringEnum<TaskPriorityEnumType>(
      Object.values(TaskPriorityEnum)
    ),
    keyword: parseAsString,
    // allow filtering by issue type (epic, story, task, bug, subtask)
    issueType: parseAsString,
    projectId: parseAsString,
    assigneeId: parseAsString,
  });
};

export default useTaskTableFilter;
