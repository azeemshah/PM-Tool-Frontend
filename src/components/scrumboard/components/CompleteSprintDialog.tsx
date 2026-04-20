import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sprint } from "@/api/scrumboard/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { showAlertDialog } from "@/lib/modal-alert";

interface CompleteSprintDialogProps {
  open: boolean;
  onClose: () => void;
  sprint: Sprint;
  otherSprints: Sprint[];
  onConfirm: (targetSprintId?: string) => void;
  isLoading: boolean;
}

const CompleteSprintDialog: React.FC<CompleteSprintDialogProps> = ({
  open,
  onClose,
  sprint,
  otherSprints,
  onConfirm,
  isLoading,
}) => {
  const [sendToBacklog, setSendToBacklog] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  const handleConfirm = async () => {
    if (sendToBacklog) {
      onConfirm();
    } else {
      if (!selectedSprintId) {
        await showAlertDialog({
          title: "Select sprint",
          description: "Please select a sprint",
          confirmText: "OK",
        });
        return;
      }
      onConfirm(selectedSprintId);
    }
  };

  const nonDoneItemsCount = sprint.workItems?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Sprint: {sprint.name}</DialogTitle>
          <DialogDescription>
            You have {nonDoneItemsCount} work items that are not in "Done"
            status. Where would you like to send them?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Backlog Option */}
          <div
            className={cn(
              "p-4 rounded-lg border-2 cursor-pointer transition-colors",
              sendToBacklog
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-gray-200 dark:border-gray-800",
            )}
            onClick={() => setSendToBacklog(true)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={sendToBacklog}
                onCheckedChange={(checked) =>
                  setSendToBacklog(checked === true)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">
                  Send to Backlog
                </Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                  All non-done items will be moved to the backlog
                </p>
              </div>
            </div>
          </div>

          {/* Sprint Option */}
          <div
            className={cn(
              "p-4 rounded-lg border-2 cursor-pointer transition-colors",
              !sendToBacklog
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : "border-gray-200 dark:border-gray-800",
            )}
            onClick={() => setSendToBacklog(false)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={!sendToBacklog}
                onCheckedChange={() => setSendToBacklog(false)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">
                  Send to Another Sprint
                </Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1 mb-3">
                  Items will maintain their current statuses in the selected
                  sprint
                </p>
                {!sendToBacklog && (
                  <Select
                    value={selectedSprintId}
                    onValueChange={setSelectedSprintId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a sprint..." />
                    </SelectTrigger>
                    <SelectContent>
                      {otherSprints.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No other sprints available
                        </div>
                      ) : (
                        otherSprints.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.name} ({s.status})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (!sendToBacklog && !selectedSprintId)}
          >
            {isLoading ? "Completing..." : "Complete Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteSprintDialog;
