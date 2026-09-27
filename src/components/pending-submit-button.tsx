"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Submit button for server-action forms: shows progress and blocks repeat
 * submits while the action runs.
 */
export function PendingSubmitButton({
  children,
  pendingLabel,
  icon,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type" | "asChild"> & {
  pendingLabel: string;
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending || undefined} {...props}>
      {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : icon}
      {pending ? pendingLabel : children}
    </Button>
  );
}
