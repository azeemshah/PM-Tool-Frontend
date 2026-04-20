import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { toast } from "@/hooks/use-toast";
import API from "@/lib/axios-client";
import { Loader2 } from "lucide-react";
import { authApiService } from "@/api/auth/services";

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await API.post("/pm-auth/verify-otp", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Login success logic (similar to Sign-in)
      const user = data.user;
      const bearer = data.accessToken || data.token || (data as any)?.access_token;
      if (bearer) {
        localStorage.setItem('accessToken', bearer);
        API.defaults.headers.common['Authorization'] = `Bearer ${bearer}`;
      }
      
      const workspaceId = typeof user?.currentWorkspace === 'string' 
        ? user.currentWorkspace 
        : user?.currentWorkspace?._id;
      navigate(workspaceId ? `/workspace/${workspaceId}` : `/workspace`);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid OTP",
        variant: "destructive",
      });
    },
  });

  const { mutate: resendOtp, isPending: isResending } = useMutation({
    mutationFn: () => authApiService.resendOtp({ email }),
    onSuccess: (data: any) => {
      setResendCooldown(30);
      toast({
        title: "OTP Resent",
        description: data?.message || "A new OTP has been sent to your email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to resend OTP",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    mutate({ email, otp });
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0 || isResending) return;
    resendOtp();
  };

  if (!email) return null;

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
              <CardTitle className="text-xl">Enter OTP</CardTitle>
              <CardDescription>
                We have sent a 6-digit code to {email}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                <Button type="submit" disabled={isPending || otp.length < 6}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Login
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isResending || resendCooldown > 0}
                >
                  {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Resend OTP"}
                </Button>
                <div className="text-center text-sm">
                   <Link to="/" className="text-primary hover:underline">Back to Login</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
