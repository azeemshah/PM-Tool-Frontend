import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { CheckIcon, CopyIcon, Loader } from "lucide-react";
import { BASE_ROUTE } from "@/routes/common/routePaths";

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const [copied, setCopied] = useState(false);

  const inviteUrl = workspace
    ? `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
        ":inviteCode",
        workspace.inviteCode
      )}`
    : "";

  console.log('InviteMember workspace:', { workspace, inviteCode: workspace?.inviteCode, inviteUrl });

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        toast({
          title: "Copied",
          description: "Invite url copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };
  return (
    <div className="flex flex-col pt-0.5 px-0 ">
      <h5 className="text-lg  leading-[30px] font-semibold mb-1">
        Invite members to join you
      </h5>
      <p className="text-sm text-muted-foreground leading-tight">
        Anyone with an invite link can join this free Workspace. You can also
        disable and create a new invite link for this Workspace at any time.
      </p>

      {workspaceLoading ? (
        <Loader
          className="w-8 h-8 
      animate-spin
      place-self-center
      flex"
        />
      ) : (
        <div className="flex py-3 gap-2">
          <Label htmlFor="link" className="sr-only">
            Link
          </Label>
          <Input
            id="link"
            disabled={true}
            className="disabled:opacity-100 disabled:pointer-events-none rounded-l-md"
            value={inviteUrl}
            readOnly
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 bg-black text-white p-3 rounded-r-md flex items-center justify-center"
            aria-label="Copy invite link"
          >
            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default InviteMember;
