import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authApiService } from "@/api/auth/services";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ChangePasswordDialog = (props: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isOpen, setIsOpen } = props;
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [isOpen]);

  const { mutate, isPending } = useMutation({
    mutationFn: authApiService.changePassword,
    onSuccess: () => {
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Password changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: "Error",
        description: "Current password and new password must be different",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and retype password must match",
        variant: "destructive",
      });
      return;
    }

    mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Update your password using your current password.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Retype Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Retype new password"
              autoComplete="new-password"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader className="animate-spin" />}
              Change password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;