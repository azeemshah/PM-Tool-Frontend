import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspaceMutationFn } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import BoardTypeSelector from "./board-type-selector";

export default function CreateWorkspaceForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createWorkspaceMutationFn,
  });

  const formSchema = z.object({
    name: z.string().trim().min(1, {
      message: "Workspace name is required",
    }),
    description: z.string().trim(),
    boardType: z.enum(["kanban", "scrumboard"], {
      errorMap: () => ({ message: "Please select a board type" }),
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      boardType: "kanban",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    mutate({ name: values.name || '', description: values.description || '', boardType: values.boardType } as any, {
      onSuccess: (data) => {
        queryClient.resetQueries({
          queryKey: ["userWorkspaces"],
        });

        const workspace = data.workspace;
        onClose();
        setTimeout(() => {
          // Manual cleanup to prevent UI freeze
          document.body.style.pointerEvents = "";
          document.body.style.overflow = "";
          navigate(`/workspace/${workspace._id}`);
        }, 300);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <main className="w-full flex flex-row min-h-[590px] h-auto max-w-full">
      <div className="h-full px-10 py-10 flex-1">
        <div className="mb-5">
          <h1
            className="text-2xl tracking-[-0.16px] dark:text-[#fcfdffef] font-semibold mb-1.5
           text-center sm:text-left"
          >
            Let's build a Project
          </h1>
          <p className="text-muted-foreground text-lg leading-tight">
            Optimize workflow by ensuring every project is available from one central spot.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Guru's Co."
                        className="!h-[48px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is the name of your company, team or organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mb-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                      Project description
                      <span className="text-xs font-extralight ml-2">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="where our team manages all marketing projects and tasks."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      - Invite your team to join by sharing a quick note about your Project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <BoardTypeSelector />

            <Button
              disabled={isPending}
              className="w-full h-[40px] font-semibold"
              type="submit"
            >
              {isPending && <Loader className="animate-spin" />}
              Create Project
            </Button>
          </form>
        </Form>
      </div>
      <div
        className="relative flex-1 shrink-0 hidden bg-muted md:block
      bg-[url('/images/workspace.jpg')] bg-cover bg-center h-full
      "
      />
    </main>
  );
}





