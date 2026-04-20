import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
};

type AlertOptions = {
  title?: string;
  description: string;
  confirmText?: string;
};

function getContainer() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  const cleanup = () => {
    root.unmount();
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  };

  return { root, cleanup };
}

function ConfirmModal({
  options,
  onResolve,
}: {
  options: ConfirmOptions;
  onResolve: (confirmed: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const settledRef = useRef(false);

  useEffect(() => {
    if (!open && !settledRef.current) {
      settledRef.current = true;
      onResolve(false);
    }
  }, [open, onResolve]);

  const confirmClass =
    options.variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-green-600 text-white hover:bg-green-700";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            {options.title || "Are you sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {options.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md border-slate-300">
            {options.cancelText || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={confirmClass}
            onClick={() => {
              if (settledRef.current) return;
              settledRef.current = true;
              onResolve(true);
            }}
          >
            {options.confirmText || "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AlertModal({
  options,
  onResolve,
}: {
  options: AlertOptions;
  onResolve: () => void;
}) {
  const [open, setOpen] = useState(true);
  const settledRef = useRef(false);

  useEffect(() => {
    if (!open && !settledRef.current) {
      settledRef.current = true;
      onResolve();
    }
  }, [open, onResolve]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            {options.title || "Notice"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {options.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => {
              if (settledRef.current) return;
              settledRef.current = true;
              onResolve();
            }}
          >
            {options.confirmText || "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function showConfirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const { root, cleanup } = getContainer();
    const onResolve = (confirmed: boolean) => {
      resolve(confirmed);
      cleanup();
    };

    root.render(<ConfirmModal options={options} onResolve={onResolve} />);
  });
}

export function showAlertDialog(options: AlertOptions): Promise<void> {
  return new Promise((resolve) => {
    const { root, cleanup } = getContainer();
    const onResolve = () => {
      resolve();
      cleanup();
    };

    root.render(<AlertModal options={options} onResolve={onResolve} />);
  });
}
