import { Loader } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import useAuth from "@/hooks/api/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApiService } from "@/api/workspace/services";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

const InviteUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const param = useParams();
  const inviteCode = param.inviteCode as string;

  const { data: authData, isPending: authLoading } = useAuth();
  const user = authData?.user;

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: workspaceApiService.inviteUserJoinWorkspace,
  });

  // Auto-join when user is logged in
  useEffect(() => {
    if (user && !authLoading && inviteCode) {
      handleAutoJoin();
    }
  }, [user, authLoading, inviteCode]);

  const returnUrl = encodeURIComponent(
    `${BASE_ROUTE.INVITE_URL.replace(":inviteCode", inviteCode)}`
  );

  const handleAutoJoin = () => {
    console.log('🔍 handleAutoJoin called with inviteCode:', inviteCode);
    mutate(inviteCode, {
      onSuccess: (data) => {
        console.log('✅ Join successful, data:', data);
        
        if (!data?.workspaceId) {
          console.error('❌ No workspaceId in response:', data);
          toast({
            title: "Error",
            description: "Invalid response structure - workspaceId missing",
            variant: "destructive",
          });
          return;
        }

        // Refresh relevant queries so UI reflects new membership
        try {
          // Invalidate auth user so `currentWorkspace` and workspaces list refresh
          queryClient.invalidateQueries({ queryKey: ["authUser"] });
          // Invalidate user's workspaces list
          queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
          // Invalidate the workspace data (members list)
          queryClient.invalidateQueries({ queryKey: ["workspace", data.workspaceId] });
        } catch (e) {
          console.error('⚠️ Error invalidating queries:', e);
        }

        toast({ title: "Success", description: "Successfully joined workspace!" });

        console.log('🚀 Navigating to workspace:', `/workspace/${data.workspaceId}`);
        // Navigate to the joined workspace
        navigate(`/workspace/${data.workspaceId}`);
      },
      onError: (error: any) => {
        console.error('❌ Join failed with error:', error);
        console.error('📋 Error response:', error?.response);
        toast({
          title: "Error Joining Workspace",
          description: error?.response?.data?.message || error.message || "Failed to join workspace. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    handleAutoJoin();
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo />
          PM Tool
        </Link>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                Hey there! You're invited to join a PM Tool Workspace!
              </CardTitle>
              <CardDescription>
                Looks like you need to be logged into your PM Tool account to
                join this Workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authLoading || (user && isLoading) ? (
                <Loader className="!w-11 !h-11 animate-spin place-self-center flex" />
              ) : (
                <div>
                  {user ? (
                    <div className="flex items-center justify-center my-3">
                      <form onSubmit={handleSubmit}>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="!bg-green-500 !text-white text-[23px] !h-auto"
                        >
                          {isLoading && (
                            <Loader className="!w-6 !h-6 animate-spin" />
                          )}
                          Join the Workspace
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <Link
                        className="flex-1 w-full text-base"
                        to={`/sign-up?returnUrl=${returnUrl}`}
                      >
                        <Button className="w-full">Signup</Button>
                      </Link>
                      <Link
                        className="flex-1 w-full text-base"
                        to={`/?returnUrl=${returnUrl}`}
                      >
                        <Button variant="secondary" className="w-full border">
                          Login
                        </Button>
                      </Link>
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

export default InviteUser;





