import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authApiService } from "@/api/auth/services";
import { useAuthContext } from "@/context/auth-provider";
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

const EditProfileDialog = (props: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isOpen, setIsOpen } = props;
  const { user, refetchAuth } = useAuthContext();
  const { toast } = useToast();

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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;