import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

const useTaskTableFilter = () => {
  return useQueryStates({
    status: parseAsString,
    priority: parseAsStringEnum(Object.values(TaskPriorityEnum) as TaskPriorityEnumType[]),
    keyword: parseAsString,
    // allow filtering by issue type (epic, story, task, bug, subtask)
    issueType: parseAsString,
    projectId: parseAsString,
    assigneeId: parseAsString,
  });
};

export default useTaskTableFilter;





