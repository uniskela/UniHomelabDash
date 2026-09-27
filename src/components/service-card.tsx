"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  HeartPulse,
  MoreVertical,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type { ManualService } from "@/lib/services/types";
import {
  checkServiceHealthAction,
  deleteServiceAction,
} from "@/lib/services/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { HealthBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ServiceCard({
  service,
  onEdit,
  headingLevel = "h3",
}: {
  service: ManualService;
  onEdit?: (service: ManualService) => void;
  headingLevel?: "h2" | "h3";
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const degraded = service.healthStatus === "degraded";

  return (
    <>
      <Card
        className={cn(
          "border border-border/80 bg-card/80 ring-0 transition-colors hover:border-foreground/20",
          degraded && "border-warning/30"
        )}
      >
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle as={headingLevel} className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-base ring-1 ring-border/60",
                  degraded && "ring-warning/40"
                )}
              >
                {service.icon || service.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 truncate">{service.name}</span>
            </CardTitle>
            <span className="shrink-0 rounded-full bg-muted/60 px-2 py-0.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
              {service.category}
            </span>
          </div>
          <CardDescription className="truncate font-mono text-xs">
            {service.host || service.url}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <HealthBadge status={service.healthStatus} />
            <span className="text-xs text-muted-foreground">
              {service.lastCheckedAt ? (
                <>
                  Checked{" "}
                  <time dateTime={service.lastCheckedAt}>{formatDate(service.lastCheckedAt)}</time>
                </>
              ) : (
                "Not checked yet"
              )}
            </span>
          </div>

          {degraded && service.healthErrorMessage ? (
            <p className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2 text-sm">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              <span className="min-w-0 break-words">{service.healthErrorMessage}</span>
            </p>
          ) : null}

          {service.notes ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{service.notes}</p>
          ) : null}

          {!service.healthUrl ? (
            onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(service)}
                className="w-fit rounded-sm text-left text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Add a health check URL to enable checks
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                No health check URL. Add one from Services to enable checks.
              </p>
            )
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <Button variant="secondary" size="sm" asChild>
              <a href={service.url} target="_blank" rel="noopener noreferrer">
                Open
                <span className="sr-only">
                  {" "}
                  {service.name} (opens in a new tab)
                </span>
                <ArrowUpRight aria-hidden />
              </a>
            </Button>

            <form action={checkServiceHealthAction}>
              <input type="hidden" name="id" value={service.id} />
              <PendingSubmitButton
                variant="outline"
                size="sm"
                disabled={!service.healthUrl}
                icon={<HeartPulse aria-hidden />}
                pendingLabel="Checking…"
                aria-label={`Check health of ${service.name}`}
              >
                Check
              </PendingSubmitButton>
            </form>

            {onEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto text-muted-foreground"
                    aria-label={`More actions for ${service.name}`}
                  >
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onEdit(service)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {onEdit ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Delete {service.name}?</DialogTitle>
              <DialogDescription>
                This removes the service and its notes from UniHomelabDash. The service itself is
                not affected, and you can add it again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <form action={deleteServiceAction}>
                <input type="hidden" name="id" value={service.id} />
                <PendingSubmitButton variant="destructive" pendingLabel="Deleting…" className="w-full">
                  Delete service
                </PendingSubmitButton>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
