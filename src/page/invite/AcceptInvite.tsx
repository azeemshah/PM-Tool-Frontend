import { Loader } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import useAuth from "@/hooks/api/use-auth";
import API from "@/lib/axios-client";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const token = searchParams.get("token") || params.token;
  const { data: authData, isPending: authLoading } = useAuth();
  const user = authData?.user;

  const returnUrl = encodeURIComponent(token ? `/invite?token=${token}` : "/invite");

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async (inviteToken: string) => {
      const response = await API.post(`/pm-members/invite/accept`, {
        token: inviteToken,
      });
      return response.data;
    },
  });

  const handleAcceptInvite = () => {
    if (!token) {
      console.error("❌ No token provided");
      toast({
        title: "Error",
        description: "No invitation token provided",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login or sign up with invited email first.",
        variant: "destructive",
      });
      return;
    }

    console.log("🔍 Accepting invitation with token:", token.substring(0, 10) + "...");
    console.log("📧 Backend URL:", import.meta.env.VITE_API_BASE_URL || "Using mock API");
    
    mutate(token, {
      onSuccess: (data) => {
        console.log("✅ Invitation accepted successfully");
        console.log("📦 Response data:", data);

        const workspaceId =
          data?.member?.workspaceId ||
          data?.data?.member?.workspaceId ||
          data?.workspaceId ||
          data?.data?.workspaceId;

        queryClient.invalidateQueries({ queryKey: ["authUser"] });
        queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });

        toast({
          title: "Success",
          description: "Invitation accepted! Redirecting...",
          variant: "success",
        });

        console.log("🚀 Redirecting to workspace");
        setTimeout(() => {
          navigate(workspaceId ? `/workspace/${workspaceId}` : "/workspace");
        }, 500);
      },
      onError: (error: any) => {
        console.error("❌ Invitation acceptance failed");
        console.error("📋 Error object:", error);
        console.error("📋 Error response status:", error?.response?.status);
        console.error("📋 Error response data:", error?.response?.data);
        console.error("📋 Error message:", error?.message);

        // Extract error message from different possible response formats
        let errorMessage = "Failed to accept invitation. Please try again.";
        
        if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        console.error("🔴 Final error message:", errorMessage);

        toast({
          title: "Error Accepting Invitation",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <Logo />
          PM Tool
        </a>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Workspace Invitation</CardTitle>
              <CardDescription>
                Accept this invite with your PM Tool account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-24">
              {authLoading || isLoading ? (
                <Loader className="!w-12 !h-12 animate-spin" />
              ) : (
                <div className="text-center w-full">
                  {!token && (
                    <div>
                      <p className="text-gray-600 mb-4">No invitation token found.</p>
                      <Button onClick={() => navigate("/")}>Go to Login</Button>
                    </div>
                  )}

                  {token && !user && (
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <Link className="flex-1 w-full text-base" to={`/sign-up?returnUrl=${returnUrl}`}>
                        <Button className="w-full">Signup</Button>
                      </Link>
                      <Link className="flex-1 w-full text-base" to={`/?returnUrl=${returnUrl}`}>
                        <Button variant="secondary" className="w-full border">
                          Login
                        </Button>
                      </Link>
                    </div>
                  )}

                  {token && user && (
                    <div className="space-y-4">
                      <p className="text-gray-600">Logged in as {user.email}</p>
                      <Button onClick={handleAcceptInvite} className="w-full">
                        Accept Invitation
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
