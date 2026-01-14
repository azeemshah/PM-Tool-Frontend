import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { Loader, CheckIcon, CopyIcon } from "lucide-react";
import { memberApiService } from "@/api/member/services/memberApiService";
import { BASE_ROUTE } from "@/routes/common/routePaths";

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"USER" | "VIEWER">("USER");
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

    setLoading(true);
    try {
      await memberApiService.inviteMember({ email: email.trim(), role, workspaceId: workspace!.id });
      toast({
        title: "Success",
        description: "Invitation sent successfully",
        variant: "success",
      });
      setEmail("");
      setRole("USER");
    } catch (error: any) {
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
    <div className="flex flex-col pt-0.5 px-0 space-y-6">
      <div>
        <h5 className="text-lg font-semibold mb-1">
          Invite members to join you
        </h5>
        <p className="text-sm text-muted-foreground">
          Invite via email or share an invite link.
        </p>
      </div>

      {/* Invite Link Section */}
      <div className="flex gap-2">
        <Input
          value={inviteUrl}
          disabled
          className="disabled:opacity-100 disabled:pointer-events-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="bg-black text-white px-3 rounded-md flex items-center justify-center"
        >
          {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Email Invite Section */}
      <div className="space-y-4">
        <div>
          <Label>Email Address</Label>
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={(value: "USER" | "VIEWER") => setRole(value)} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleInvite} disabled={loading} className="w-full">
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
  );
};

export default InviteMember;
