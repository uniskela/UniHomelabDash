"use client";

import { TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InlineNotice({
  children,
  onDismiss,
  dismissLabel,
}: {
  children: React.ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm"
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
      {onDismiss ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="-my-1 -mr-1 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
          aria-label={dismissLabel ?? "Dismiss"}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
