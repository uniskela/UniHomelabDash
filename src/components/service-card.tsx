"use client";

import { useState } from "react";
import { ArrowUpRight, HeartPulse, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { HealthStatus, ManualService } from "@/lib/services/types";
import {
  checkServiceHealthAction,
  deleteServiceAction,
} from "@/lib/services/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
}: {
  service: ManualService;
  onEdit?: (service: ManualService) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openService() {
    window.open(service.url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition hover:ring-foreground/20",
          "focus-within:ring-2 focus-within:ring-ring/50"
        )}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button, a, form, [role='menuitem']")) {
            return;
          }
          openService();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            const target = event.target as HTMLElement;
            if (target.closest("button, a, form")) {
              return;
            }
            event.preventDefault();
            openService();
          }
        }}
        tabIndex={0}
        role="group"
        aria-label={`${service.name} service card`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-base">
              {service.icon || service.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 truncate">{service.name}</span>
          </CardTitle>
          <CardDescription className="truncate">
            {service.host || service.url}
          </CardDescription>
          <CardAction>
            <Badge variant="outline">{service.category}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <HealthBadge status={service.healthStatus} />
            <span className="text-xs text-muted-foreground">
              {service.lastCheckedAt
                ? `Checked ${formatDate(service.lastCheckedAt)}`
                : "Not checked yet"}
            </span>
          </div>

          {service.healthStatus === "degraded" && service.healthErrorMessage ? (
            <p className="text-sm text-amber-300/90">{service.healthErrorMessage}</p>
          ) : null}

          {!service.healthUrl ? (
            <p className="text-xs text-muted-foreground">
              Add a health check URL to run status checks.
            </p>
          ) : null}

          {service.notes ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{service.notes}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                openService();
              }}
            >
              Open
              <ArrowUpRight />
            </Button>

            <form action={checkServiceHealthAction} onClick={(event) => event.stopPropagation()}>
              <input type="hidden" name="id" value={service.id} />
              <Button
                type="submit"
                variant="outline"
                disabled={!service.healthUrl}
                title={
                  service.healthUrl
                    ? "Run health check now"
                    : "Add a health check URL in Edit to enable checks"
                }
              >
                <HeartPulse />
                Check
              </Button>
            </form>

            {onEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`More actions for ${service.name}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
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
                This removes the service from your dashboard. You can add it again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <form
                action={deleteServiceAction}
                onSubmit={() => setDeleteOpen(false)}
              >
                <input type="hidden" name="id" value={service.id} />
                <Button type="submit" variant="destructive">
                  Delete service
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        status === "healthy" && "border-rose-400/40 bg-rose-400/10 text-rose-300",
        status === "degraded" && "border-amber-500/40 bg-amber-500/10 text-amber-300",
        status === "unknown" && "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
