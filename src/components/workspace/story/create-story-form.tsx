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
import { issueApiService } from "@/api/issue/services/issueApiService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function CreateStoryForm(props: {
  epicId: string;
  onClose: () => void;
}) {
  const { epicId, onClose } = props;
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ epicId, data }: { epicId: string; data: any }) =>
      issueApiService.createStory(epicId, data),
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
      title: "",
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    mutate(
      {
        epicId,
        data: { title: values.title || '', description: values.description || '' },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["stories", epicId],
          });

          toast({
            title: "Success",
            description: "Story created successfully",
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
            Create Story
          </h1>
          <p className="text-muted-foreground text-sm leading-tight">
            Create a new story within this epic
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., User Login Page"
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
                      placeholder="Describe the user story and acceptance criteria"
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
              Create Story
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}





