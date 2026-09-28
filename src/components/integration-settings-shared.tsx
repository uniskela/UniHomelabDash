"use client";

import { CheckCircle2, PlugZap, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toneSurfaceClasses, toneTextClasses } from "@/components/status-tone";
import { cn } from "@/lib/utils";

export function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  hiddenName,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled: boolean;
  hiddenName: string;
}) {
  const descriptionId = `${id}-description`;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/20 p-3 sm:p-4">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={descriptionId}
      />
      <input type="hidden" name={hiddenName} value={checked ? "true" : "false"} />
    </div>
  );
}

export function ConnectionState({
  targetLabel,
  statusOk,
  statusMessage,
  lastTestedAt,
}: {
  targetLabel: string;
  statusOk: boolean;
  statusMessage: string;
  lastTestedAt: string | null;
}) {
  const tone = statusOk ? "success" : statusMessage ? "danger" : "neutral";
  const Icon = statusOk ? CheckCircle2 : statusMessage ? XCircle : PlugZap;

  return (
    <div className={cn("rounded-lg border p-3 sm:p-4", toneSurfaceClasses[tone])}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", toneTextClasses[tone])} />
        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-medium">
            {statusOk
              ? `Connected to ${targetLabel}`
              : statusMessage
                ? "Connection issue"
                : "Not tested yet"}
          </p>
          {lastTestedAt ? (
            <p className="text-muted-foreground">
              Last tested {new Date(lastTestedAt).toLocaleString()}
            </p>
          ) : (
            <p className="text-muted-foreground">Save your settings, then run Test connection.</p>
          )}
          {statusMessage ? (
            <p
              className={cn("break-words", statusOk ? "text-muted-foreground" : "text-destructive")}
              role={statusOk ? "status" : "alert"}
            >
              {statusMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
