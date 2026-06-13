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
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
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
          >
            {open ? "Hide" : "Show"}
            <ChevronDown className={cn("transition", open && "rotate-180")} />
          </Button>
        </div>
      </CardHeader>
      {open ? (
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="text-muted-foreground">Database path</div>
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
            <div className="mb-2 flex items-center gap-2 font-medium">
              <ServerOff className="size-4" />
              Planned integrations
            </div>
            <ul className="grid gap-2 text-muted-foreground sm:grid-cols-3">
              <li className="rounded-lg border bg-muted/30 p-3">Docker monitoring</li>
              <li className="rounded-lg border bg-muted/30 p-3">Portainer actions</li>
              <li className="rounded-lg border bg-muted/30 p-3">Proxmox and media apps</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              {authEnabled
                ? "Authentication is enabled. Privileged integrations still require the provider system before they ship."
                : "These require authentication and a safer provider model before they ship."}
            </p>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
