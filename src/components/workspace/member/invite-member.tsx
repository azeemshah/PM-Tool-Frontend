import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { Loader, CheckIcon, CopyIcon } from "lucide-react";
import { memberApiService } from "@/api/member/services/memberApiService";
import { BASE_ROUTE } from "@/routes/common/routePaths";

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TEAM_LEAD" | "PROJECT_MANAGER" | "MEMBER" | "VIEWER" | "WATCHER">("MEMBER");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = workspace
    ? `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
      ":inviteCode",
      workspace.inviteCode
    )}`
    : "";

  const handleCopy = () => {
    if (!inviteUrl) return;

    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast({
        title: "Copied",
        description: "Invite link copied to clipboard",
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!workspace) {
      toast({
        title: "Error",
        description: "Workspace information not loaded",
        variant: "destructive",
      });
      return;
    }

    // Get workspaceId - prefer _id (MongoDB ID) over id
    const workspaceId = workspace._id || workspace.id;

    if (!workspaceId) {
      toast({
        title: "Error",
        description: "Unable to determine workspace ID. Please refresh and try again.",
        variant: "destructive",
      });
      console.error("❌ Workspace ID is missing. Workspace object:", workspace);
      return;
    }

    console.log("📧 Inviting member:", {
      email: email.trim(),
      role,
      workspaceId,
      workspace: { _id: workspace._id, id: workspace.id },
    });

    setLoading(true);
    try {
      await memberApiService.inviteMember({ email: email.trim(), role, workspaceId });
      toast({
        title: "Success",
        description: "Invitation sent successfully",
        variant: "success",
      });
      setEmail("");
      setRole("MEMBER");
    } catch (error: any) {
      console.error("❌ Invitation failed:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="flex flex-col pt-0.5 px-0">
        <Loader className="w-8 h-8 animate-spin place-self-center flex" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          Invite members to join you
        </CardTitle>
        <CardDescription>
          Invite via email or share an invite link.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={inviteUrl}
            disabled
            className="flex-1 disabled:opacity-100 disabled:pointer-events-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <CopyIcon className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Address</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                value={role}
                onValueChange={(value: "ADMIN" | "TEAM_LEAD" | "PROJECT_MANAGER" | "MEMBER" | "VIEWER" | "WATCHER") =>
                  setRole(value)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                  <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="WATCHER">Watcher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleInvite}
              disabled={loading}
              className="w-full md:w-auto h-[40px] px-6 font-semibold"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InviteMember;





