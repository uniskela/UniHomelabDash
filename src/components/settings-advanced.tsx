"use client";

import { useState } from "react";
import { ChevronDown, Database, ServerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function SettingsAdvanced({
  databasePath,
  authEnabled = true,
}: {
  databasePath: string;
  authEnabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database aria-hidden className="size-5" />
              Advanced
            </CardTitle>
            <CardDescription>
              Storage paths and planned integrations for operators.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="settings-advanced-content"
          >
            {open ? "Hide" : "Show"}
            <ChevronDown aria-hidden className={cn("transition-transform", open && "rotate-180")} />
          </Button>
        </div>
      </CardHeader>
      {open ? (
        <CardContent id="settings-advanced-content" className="space-y-4 pt-0 text-sm">
          <div>
            <h3 className="text-muted-foreground">Database path</h3>
            <code className="mt-1 block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs">
              {databasePath}
            </code>
            <p className="mt-2 text-muted-foreground">
              In Docker Compose, mount <code className="text-xs">/app/data</code> to
              keep services across container restarts.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 flex items-center gap-2 font-medium">
              <ServerOff aria-hidden className="size-4" />
              Integration roadmap
            </h3>
            <ul className="grid gap-2 text-muted-foreground sm:grid-cols-3">
              <li className="rounded-lg border bg-muted/30 p-3">Docker (status, logs, actions)</li>
              <li className="rounded-lg border bg-muted/30 p-3">Portainer (containers, actions, stacks)</li>
              <li className="rounded-lg border bg-muted/30 p-3">Alerts, Proxmox, media apps</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              {authEnabled
                ? "Docker and Portainer integrations are available above. Future phases will add alerts and broader homelab providers."
                : "Enable authentication before using provider integrations in production."}
            </p>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
