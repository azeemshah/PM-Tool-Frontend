import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authApiService } from "@/api/auth/services";
import { useAuthContext } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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

const EditProfileDialog = (props: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isOpen, setIsOpen } = props;
  const { user, refetchAuth } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [isOpen, user?.email, user?.name]);

  const { mutate, isPending } = useMutation({
    mutationFn: authApiService.updateProfile,
    onSuccess: () => {
      setIsOpen(false);
      refetchAuth();
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
    mutationFn: (options?: { deleteOwnedWorkspaces?: boolean }) => authApiService.deleteAccount(options),
    onSuccess: () => {
      setIsOpen(false);
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      navigate("/");
    },
    onError: (error: any, variables) => {
      const message = error?.response?.data?.message || error?.message || "Failed to delete account";
      const isOwnedWorkspaceConflict =
        error?.response?.status === 409 &&
        String(message).toLowerCase().includes("workspace");

      if (isOwnedWorkspaceConflict && !variables?.deleteOwnedWorkspaces) {
        const shouldDeleteAll = window.confirm(
          "You own one or more workspaces. Do you want to delete all owned workspaces and your account?",
        );

        if (shouldDeleteAll) {
          deleteAccount({ deleteOwnedWorkspaces: true });
        }
        return;
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (!normalizedName || !email.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    mutate({
      name: normalizedName,
      email: email.trim().toLowerCase(),
    });
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
    );
    if (!confirmed) return;
    deleteAccount();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your display name and email address.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>

          <div className="pt-2 border-t border-border">
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleDeleteAccount}
              disabled={isPending || isDeleting}
            >
              {isDeleting && <Loader className="animate-spin" />}
              Delete Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;