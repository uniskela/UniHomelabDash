"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, PlugZap, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  configureDockerProviderAction,
  testDockerProviderAction,
} from "@/lib/providers/actions";
import { initialProviderActionState } from "@/lib/providers/action-state";
import type { DockerConnectionMode } from "@/lib/providers/docker/config";
import type { ProviderPublicView } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

export function DockerIntegrationSettings({
  provider,
}: {
  provider: ProviderPublicView | null;
}) {
  const initialMode =
    provider?.config.mode === "tcp" || provider?.config.mode === "tls"
      ? provider.config.mode
      : "local";

  const [enabled, setEnabled] = useState(provider?.enabled ?? false);
  const [allowActions, setAllowActions] = useState(provider ? !provider.readOnly : false);
  const [connectionMode, setConnectionMode] = useState<DockerConnectionMode>(initialMode);
  const [configureState, configureAction, configurePending] = useActionState(
    configureDockerProviderAction,
    initialProviderActionState
  );
  const [testState, testAction, testPending] = useActionState(
    testDockerProviderAction,
    initialProviderActionState
  );

  const socketPath =
    typeof provider?.config.socketPath === "string"
      ? provider.config.socketPath
      : "/var/run/docker.sock";
  const host =
    typeof provider?.config.host === "string" ? provider.config.host : "127.0.0.1";
  const port =
    typeof provider?.config.port === "number"
      ? String(provider.config.port)
      : connectionMode === "tls"
        ? "2376"
        : "2375";

  const statusMessage =
    testState.message ||
    (provider?.lastError && !testState.message ? provider.lastError : "");
  const statusOk = testState.message
    ? testState.ok
    : !provider?.lastError && Boolean(provider?.lastTestedAt);

  return (
    <div className="space-y-6">
      <form action={configureAction} className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
          <div className="space-y-1">
            <Label htmlFor="docker-enabled" className="text-sm font-medium">
              Enable Docker integration
            </Label>
            <p className="text-sm text-muted-foreground">
              List containers from a local socket or remote Docker Engine API.
            </p>
          </div>
          <Switch
            id="docker-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={configurePending}
          />
          <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
          <div className="space-y-1">
            <Label htmlFor="allow-actions" className="text-sm font-medium">
              Allow container actions
            </Label>
            <p className="text-sm text-muted-foreground">
              Enable start, stop, and restart with confirmation prompts. Off by default.
            </p>
          </div>
          <Switch
            id="allow-actions"
            checked={allowActions}
            onCheckedChange={setAllowActions}
            disabled={configurePending}
          />
          <input type="hidden" name="allowActions" value={allowActions ? "true" : "false"} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="connectionMode">Connection mode</Label>
          <select
            id="connectionMode"
            name="connectionMode"
            value={connectionMode}
            onChange={(event) =>
              setConnectionMode(event.target.value as DockerConnectionMode)
            }
            disabled={configurePending}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="local">Local unix socket</option>
            <option value="tcp">Remote TCP</option>
            <option value="tls">Remote TCP with TLS</option>
          </select>
        </div>

        {connectionMode === "local" ? (
          <div className="space-y-2">
            <Label htmlFor="socketPath">Docker socket path</Label>
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
              <Input
                id="socketPath"
                name="socketPath"
                defaultValue={socketPath}
                placeholder="/var/run/docker.sock"
                disabled={configurePending}
                className="border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                name="host"
                defaultValue={host}
                placeholder="192.168.1.10"
                disabled={configurePending}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                name="port"
                defaultValue={port}
                placeholder={connectionMode === "tls" ? "2376" : "2375"}
                disabled={configurePending}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}

        {connectionMode === "tls" ? (
          <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              Paste PEM contents for TLS. Leave blank to keep existing stored credentials.
            </p>
            <div className="space-y-2">
              <Label htmlFor="tlsCa">CA certificate</Label>
              <Textarea id="tlsCa" name="tlsCa" rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tlsCert">Client certificate</Label>
              <Textarea id="tlsCert" name="tlsCert" rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tlsKey">Client key</Label>
              <Textarea id="tlsKey" name="tlsKey" rows={3} className="font-mono text-xs" />
            </div>
          </div>
        ) : null}

        {configureState.message ? (
          <p
            className={cn(
              "text-sm",
              configureState.ok ? "text-muted-foreground" : "text-destructive"
            )}
            role={configureState.ok ? "status" : "alert"}
          >
            {configureState.message}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="secondary" size="sm" disabled={configurePending}>
            {configurePending ? "Saving..." : "Save settings"}
          </Button>
          {provider ? (
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={testPending || !provider.enabled}
              form="docker-test-form"
            >
              {testPending ? "Testing..." : "Test connection"}
            </Button>
          ) : null}
        </div>
      </form>

      {provider ? <form id="docker-test-form" action={testAction} className="hidden" /> : null}

      <div className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-4">
        <h3 className="text-sm font-medium">Local socket setup</h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Copy <code className="text-xs">docker-compose.override.example.yml</code> to{" "}
            <code className="text-xs">docker-compose.override.yml</code>
          </li>
          <li>
            Set <code className="text-xs">DOCKER_GID</code> in your <code className="text-xs">.env</code>
          </li>
          <li>Recreate the container, then enable Docker above</li>
          <li>Run Test connection and open the Containers page</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          For remote hosts, use TCP/TLS mode instead. Prefer TLS or VPN-only access on your LAN.
        </p>
      </div>

      {provider && provider.enabled ? (
        <div
          className={cn(
            "rounded-xl border p-4",
            statusOk
              ? "border-rose-400/20 bg-rose-400/5"
              : statusMessage
                ? "border-destructive/30 bg-destructive/5"
                : "border-border/80 bg-muted/20"
          )}
        >
          <div className="flex items-start gap-3">
            {statusOk ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-rose-300" />
            ) : statusMessage ? (
              <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <PlugZap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {statusOk
                  ? "Connected to Docker Engine"
                  : statusMessage
                    ? "Connection issue"
                    : "Ready to test"}
              </p>
              {provider.lastTestedAt ? (
                <p className="text-muted-foreground">
                  Last tested {new Date(provider.lastTestedAt).toLocaleString()}
                </p>
              ) : null}
              {statusMessage ? (
                <p className={statusOk ? "text-muted-foreground" : "text-destructive"} role="alert">
                  {statusMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Link
        href="/containers"
        className="inline-flex text-sm text-foreground underline underline-offset-4"
      >
        Open containers page
      </Link>
    </div>
  );
}
