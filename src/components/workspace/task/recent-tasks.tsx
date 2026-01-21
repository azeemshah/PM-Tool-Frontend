import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TaskPriorityEnum, TaskStatusEnum, TaskStatusEnumType, TaskPriorityEnumType } from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import {
  getAvatarColor,
  getAvatarFallbackText,
  transformStatusEnum,
  formatStatusToEnum,
} from "@/lib/helper";
import { TaskType } from "@/types/api.type";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader, RefreshCw, ArrowDown, ArrowRight, ArrowUp, CheckCircle, Circle, HelpCircle, Timer, View } from "lucide-react";
import { issueApiService } from "@/api/issue/services/issueApiService";
import { Button } from "@/components/ui/button";

const RecentTasks = () => {
  const workspaceId = useWorkspaceId();

  // Icon mappings for status and priority
  const statusIcons = {
    [TaskStatusEnum.BACKLOG]: HelpCircle,
    [TaskStatusEnum.TO_DO]: Circle,
    [TaskStatusEnum.IN_PROGRESS]: Timer,
    [TaskStatusEnum.IN_REVIEW]: View,
    [TaskStatusEnum.DONE]: CheckCircle,
  };

  const priorityIcons = {
    [TaskPriorityEnum.LOW]: ArrowDown,
    [TaskPriorityEnum.MEDIUM]: ArrowRight,
    [TaskPriorityEnum.HIGH]: ArrowUp,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["recent-tasks", workspaceId],
    queryFn: async () => {
      console.log('[recent-tasks] Query started, workspaceId:', workspaceId);
      if (!workspaceId) {
        console.log('[recent-tasks] No workspaceId, returning empty');
        return { tasks: [] } as any;
      }
      try {
        console.log('[recent-tasks] Fetching tasks for workspace:', workspaceId);
        const tasks = await issueApiService.getTasksByWorkspace(workspaceId);
        console.log('[recent-tasks] Tasks response:', { count: tasks?.length, data: tasks });
        
        if (!tasks || tasks.length === 0) {
          console.log('[recent-tasks] No tasks found');
          return { tasks: [] } as any;
        }

        // Sort by createdAt descending and get top 5 recent
        const recent = tasks.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }).slice(0, 5);
        
        console.log('[recent-tasks] Recent tasks (after sort/slice):', recent.length);
        return { tasks: recent } as any;
      } catch (err: any) {
        console.error('[recent-tasks] Error in queryFn:', err);
        if (err?.response?.status === 401) throw err;
        return { tasks: [] } as any;
      }
    },
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const tasks: TaskType[] = data?.tasks || [];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        {isLoading && (
          <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('[recent-tasks] Manual refetch triggered');
            refetch();
          }}
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(error as any)?.response?.status === 401 ? (
            "Authentication required — please sign in to view recent tasks."
          ) : (
            "Failed to load recent tasks. Ensure the backend is running."
          )}
          {error && (error as any).message ? (
            <div className="mt-1 text-xs text-red-600">{String((error as any).message)}</div>
          ) : null}
        </div>
      )}

      {!isLoading && !isError && tasks?.length === 0 && (
        <div className="font-semibold text-sm text-muted-foreground text-center py-5">
          No Task created yet
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <ul role="list" className="divide-y divide-gray-200">
          {tasks.map((task) => {
            const name = task?.assignedTo?.name || "";
            const initials = getAvatarFallbackText(name);
            const avatarColor = getAvatarColor(name);
            return (
              <li
                key={task._id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                {/* Task Info */}
                <div className="flex flex-col space-y-1 flex-grow">
                  <span className="text-sm capitalize text-gray-600 font-medium">
                    {task.project?.name || ""}
                  </span>
                  <p className="text-md font-semibold text-gray-800 truncate">
                    {task.title}
                  </p>
                  <span className="text-sm text-gray-500">
                    Due: {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
                  </span>
                </div>

                {/* Task Status */}
                <div className="text-sm font-medium ">
                  {(() => {
                    const statusKey = formatStatusToEnum(task.status) as TaskStatusEnumType;
                    const IconComponent = statusIcons[TaskStatusEnum[statusKey]];
                    return (
                      <Badge
                        variant={TaskStatusEnum[statusKey]}
                        className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
                      >
                        {IconComponent && <IconComponent className="h-4 w-4 rounded-full text-inherit" />}
                        <span>{transformStatusEnum(task.status)}</span>
                      </Badge>
                    );
                  })()}
                </div>

                {/* Task Priority */}
                <div className="text-sm ml-2">
                  {(() => {
                    const priorityKey = formatStatusToEnum(task.priority) as TaskPriorityEnumType;
                    const IconComponent = priorityIcons[TaskPriorityEnum[priorityKey]];
                    return (
                      <Badge
                        variant={TaskPriorityEnum[priorityKey]}
                        className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
                      >
                        {IconComponent && <IconComponent className="h-4 w-4 rounded-full text-inherit" />}
                        <span>{transformStatusEnum(task.priority)}</span>
                      </Badge>
                    );
                  })()}
                </div>

                {/* Assignee */}
                <div className="flex items-center space-x-2 ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={task.assignedTo?.profilePicture || ""}
                      alt={task.assignedTo?.name}
                    />
                    <AvatarFallback className={avatarColor}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentTasks;

// const RecentTasks = () => {
//   const tasks = [
//     {
//       id: "Task-12",
//       title: "You can't compress the program without quanti",
//       date: "December 29, 2024",
//       assigneeTo: "EM",
//     },
//     {
//       id: "Task-13",
//       title: "You can't compress the program without quanti",
//       date: "December 29, 2024",
//       assigneeTo: "EM",
//     },
//     {
//       id: "Task-14",
//       title: "You can't compress the program without quanti",
//       date: "December 29, 2024",
//       assigneeTo: "EM",
//     },
//     {
//       id: "Task-15",
//       title: "You can't compress the program without quanti",
//       date: "December 29, 2024",
//       assigneeTo: "EM",
//     },
//     {
//       id: "Task-16",
//       title: "You can't compress the program without quanti",
//       date: "December 29, 2024",
//       assigneeTo: "EM",
//     },
//   ];
//   return (
//     <div className="flex flex-col pt-2">
//       <ul role="list" className="space-y-2">
//         {tasks.map((item, index) => (
//           <li
//             key={index}
//             role="listitem"
//             className="shadow-none border-0 py-2 hover:bg-[#fbfbfb] transition-colors ease-in-out "
//           >
//             <div className="grid grid-cols-7 gap-1 p-0">
//               <div className="shrink">
//                 <p>{item.id}</p>
//               </div>
//               <div className="col-span-2">
//                 <p className="text-sm font-medium leading-none">{item.title}</p>
//               </div>
//               <div>dueDate</div>
//               <div>Todo</div>
//               <div>High</div>
//               <div className="flex items-center gap-4 place-self-end">
//                 <span className="text-sm text-gray-500">Assigned To</span>
//                 <Avatar className="hidden h-9 w-9 sm:flex">
//                   <AvatarImage src="/avatars/01.png" alt="Avatar" />
//                   <AvatarFallback>{item.assigneeTo}</AvatarFallback>
//                 </Avatar>
//               </div>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default RecentTasks;





