import { Loader } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { useEffect } from "react";
import API from "@/lib/axios-client";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const token = searchParams.get("token") || params.token;

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async (inviteToken: string) => {
      const response = await API.post(`/pm-members/invite/accept`, {
        token: inviteToken,
      });
      return response.data;
    },
  });

  // Auto-accept when token is available
  useEffect(() => {
    if (token) {
      handleAcceptInvite();
    }
  }, [token]);

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

    console.log("🔍 Accepting invitation with token:", token.substring(0, 10) + "...");
    console.log("📧 Backend URL:", import.meta.env.VITE_API_BASE_URL || "Using mock API");
    
    mutate(token, {
      onSuccess: (data) => {
        console.log("✅ Invitation accepted successfully");
        console.log("📦 Response data:", data);

        // Handle different response structures
        const accessToken = data?.accessToken || data?.data?.accessToken;
        const workspaceId =
          data?.member?.workspaceId ||
          data?.data?.member?.workspaceId ||
          data?.workspaceId ||
          data?.data?.workspaceId;
        
        if (accessToken) {
          console.log("🔐 Access token received, storing...");
          // Store the access token
          localStorage.setItem("accessToken", accessToken);

          // Clear the mock auth token to trigger a fresh auth query
          localStorage.removeItem("mockAuthToken");

          // Invalidate auth queries to refresh user data
          queryClient.invalidateQueries({ queryKey: ["authUser"] });

          toast({
            title: "Success",
            description: "Invitation accepted! Redirecting...",
          });

          console.log("🚀 Redirecting to workspace");

          // Wait a moment then redirect to the invited workspace when available
          setTimeout(() => {
            navigate(workspaceId ? `/workspace/${workspaceId}` : "/workspace");
          }, 500);
        } else {
          console.error("❌ No accessToken in response:", data);
          toast({
            title: "Error",
            description: "Invalid response from server - no token received",
            variant: "destructive",
          });
        }
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

        // Redirect back after showing error
        setTimeout(() => {
          navigate("/");
        }, 3000);
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
              <CardTitle className="text-xl">
                Accepting Your Invitation
              </CardTitle>
              <CardDescription>
                Please wait while we process your invitation...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {isLoading ? (
                <Loader className="!w-12 !h-12 animate-spin" />
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {token
                      ? "Processing invitation..."
                      : "No invitation token found"}
                  </p>
                  {!token && (
                    <Button onClick={() => navigate("/")} className="mt-4">
                      Go to Login
                    </Button>
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
