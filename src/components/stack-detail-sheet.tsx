"use client";

import { useEffect, useState } from "react";
import { CircleAlert, LoaderCircle, Unplug } from "lucide-react";
import { ContainerStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  lastReportedLifecycle,
  restoreStackDetailFocus,
  StackContainerRequestController,
  type StackContainerRequestState,
} from "@/lib/providers/stack-container-request";
import type { StackContainerResource, StackResource } from "@/lib/providers/types";

export function StackDetailSheet({
  stack,
  open,
  onOpenChange,
  originatingElement,
}: {
  stack: StackResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originatingElement: HTMLElement | null;
}) {
  const [requestState, setRequestState] = useState<StackContainerRequestState>({ kind: "idle" });
  const [controller] = useState(() => new StackContainerRequestController());

  useEffect(() => {
    if (!open || !stack) {
      controller.abort();
      return;
    }

    void controller.load(stack, false, setRequestState);

    return () => {
      controller.abort();
    };
  }, [controller, open, stack]);

  const retry = () => {
    if (stack) {
      void controller.load(stack, true, setRequestState);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      controller.abort();
      setRequestState({ kind: "idle" });
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          restoreStackDetailFocus(event, originatingElement);
        }}
      >
        <SheetHeader>
          <SheetTitle>{stack?.name ?? "Stack containers"}</SheetTitle>
          <SheetDescription>
            {stack ? `${stack.endpointName} · ${stack.providerName}` : "Read-only container membership."}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <ContainerContent
            state={requestState}
            onRetry={retry}
            reportedStatus={stack?.reportedStatus}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContainerContent({
  state,
  onRetry,
  reportedStatus,
}: {
  state: StackContainerRequestState;
  onRetry: () => void;
  reportedStatus?: StackResource["reportedStatus"];
}) {
  if (state.kind === "idle") {
    return null;
  }

  if (state.kind === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-rose-300" />
        Loading read-only container membership…
      </div>
    );
  }

  if (state.kind === "ok") {
    return (
      <div className="space-y-3">
        {state.containers.map((container) => (
          <ContainerRow key={container.id} container={container} />
        ))}
      </div>
    );
  }

  if (state.kind === "empty") {
    return <StateNotice title="No containers found" description="This stack has no matching containers." />;
  }

  if (state.kind === "unavailable") {
    return (
      <StateNotice
        icon={Unplug}
        title="Endpoint unavailable"
        description={`This endpoint is disconnected, so container membership was not requested.${reportedStatus ? ` ${lastReportedLifecycle(reportedStatus)}` : ""}`}
      />
    );
  }

  if (state.kind === "unauthenticated") {
    return (
      <StateNotice
        title="Sign in again"
        description="Your session has expired. Sign in again to view stack containers."
      />
    );
  }

  if (state.kind === "not-found") {
    return (
      <StateNotice
        title="Stack not found"
        description="This stack is no longer available from the configured Portainer integration."
      />
    );
  }

  if (state.kind === "server-error") {
    return (
      <StateNotice
        title="Container details unavailable"
        description="The provider could not load this stack's containers."
        onRetry={onRetry}
      />
    );
  }

  return (
    <StateNotice
      title="Could not load containers"
      description="UniHomelabDash could not reach the stack container service."
      onRetry={onRetry}
    />
  );
}

function StateNotice({
  icon: Icon = CircleAlert,
  title,
  description,
  onRetry,
}: {
  icon?: typeof CircleAlert;
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

function ContainerRow({ container }: { container: StackContainerResource }) {
  return (
    <article className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{container.name}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">{container.image}</p>
        </div>
        <ContainerStatusBadge status={container.state} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <ContainerDetail label="Ports" value={container.ports.join(", ") || "No published ports."} />
        {container.createdAt ? (
          <ContainerDetail label="Created" value={new Date(container.createdAt).toLocaleString()} />
        ) : null}
      </dl>
    </article>
  );
}

function ContainerDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
    </div>
  );
}
