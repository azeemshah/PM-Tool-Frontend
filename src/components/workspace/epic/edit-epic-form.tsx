import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateEpicMutationFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface Epic {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
}

export default function EditEpicForm(props: {
  epic: Epic;
  projectId: string;
  onClose: () => void;
}) {
  const { epic, projectId, onClose } = props;
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateEpicMutationFn,
  });

  const formSchema = z.object({
    title: z.string().trim().min(1, {
      message: "Title is required",
    }),
    description: z.string().trim().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: epic?.title ?? "",
      description: epic?.description ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    mutate(
      {
        epicId: epic._id,
        data: values,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["epics", projectId],
          });

          toast({
            title: "Success",
            description: "Epic updated successfully",
            variant: "success",
          });
          onClose();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="w-full h-auto max-w-full">
      <div className="h-full">
        <div className="mb-5 pb-2 border-b">
          <h1 className="text-xl font-semibold text-center sm:text-left">
            Edit Epic
          </h1>
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Epic Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., User Authentication System"
                      className="!h-[48px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description
                    <span className="text-xs font-extralight ml-2">
                      Optional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the epic goals and scope"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              className="flex place-self-end h-[40px] text-white font-semibold"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader className="animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
