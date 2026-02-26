import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Logo from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { authApiService } from "@/api/auth/services";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({ mutationFn: authApiService.forgotPassword });

  const formSchema = z.object({
    email: z.string().trim().email("Invalid email address").min(1, {
      message: "Email is required",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    mutate({ email: values.email || '' }, {
      onSuccess: () => {
        toast({ title: "Success", description: "If the email exists, a reset link was sent." });
        navigate("/");
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <Logo />
          PM Tool
        </Link>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Forgot password</CardTitle>
              <CardDescription>Enter your email to receive reset instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-[#f1f7feb5] text-sm">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="m@example.com" className="!h-[48px]" {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full">
                      {isPending && <Loader className="animate-spin" />}
                      Send reset link
                    </Button>
                    <div className="text-center text-sm">
                      Remembered your password? <Link to="/" className="underline underline-offset-4">Sign in</Link>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;





