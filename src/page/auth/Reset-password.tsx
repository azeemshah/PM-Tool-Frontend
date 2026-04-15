import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { PasswordInput } from "@/components/ui/password-input";
import Logo from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { authApiService } from "@/api/auth/services";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get("token") || "";

  const { mutate, isPending } = useMutation({ mutationFn: authApiService.resetPassword });

  const formSchema = z
    .object({
      newPassword: z.string().trim().min(8, { message: "Password must be at least 8 characters" }),
      confirmPassword: z.string().trim().min(8, { message: "Please retype your password" }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New Password and Retype New Password must be same",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;

    if (!tokenFromQuery) {
      toast({ title: "Error", description: "Invalid reset link", variant: "destructive" });
      return;
    }

    mutate({ token: tokenFromQuery, newPassword: values.newPassword }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Password has been reset." });
        navigate("/");
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to reset password";

        toast({ title: "Error", description: errorMessage, variant: "destructive" });
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
              <CardTitle className="text-xl">Reset password</CardTitle>
              <CardDescription>Set a new password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-[#f1f7feb5] text-sm">New Password</FormLabel>
                            <FormControl>
                              <PasswordInput className="!h-[48px]" {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-[#f1f7feb5] text-sm">Retype New Password</FormLabel>
                            <FormControl>
                              <PasswordInput className="!h-[48px]" {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full">
                      {isPending && <Loader className="animate-spin" />}
                      Reset password
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

export default ResetPassword;





