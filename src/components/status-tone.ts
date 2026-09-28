/**
 * Shared colour language for status. Brand rose is reserved for actions and
 * navigation; status always uses these semantic tones so "good" and "bad"
 * never share a hue.
 */
export type StatusTone = "success" | "warning" | "danger" | "neutral";

export const toneBadgeClasses: Record<StatusTone, string> = {
  success: "border-success/35 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/10 text-warning",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted/40 text-muted-foreground",
};

export const toneSurfaceClasses: Record<StatusTone, string> = {
  success: "border-success/25 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-destructive/30 bg-destructive/5",
  neutral: "border-border/70 bg-card",
};

export const toneIconClasses: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export const toneTextClasses: Record<StatusTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
};
