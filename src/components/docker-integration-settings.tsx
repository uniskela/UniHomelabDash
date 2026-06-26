"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, PlugZap, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  configureDockerProviderAction,
  createDockerProviderAction,
  deleteDockerProviderAction,
  testDockerProviderAction,
} from "@/lib/providers/actions";
import { initialProviderActionState } from "@/lib/providers/action-state";
import type { DockerConnectionMode } from "@/lib/providers/docker/config";
import type { ProviderPublicView } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

export function DockerIntegrationSettings({
  providers,
}: {
  providers: ProviderPublicView[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Configure one or more Docker Engine connections.</p>
          <p>Actions are disabled by default for every integration.</p>
        </div>
        <form action={createDockerProviderAction}>
          <Button type="submit" size="sm">
            <Plus />
            Add Docker integration
          </Button>
        </form>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">
          No Docker integrations configured yet. Add one to connect a local socket or remote Docker Engine.
        </div>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <DockerIntegrationCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}

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
          <li>Recreate the container, then enable the Docker integration.</li>
          <li>Run Test connection and open the Containers page.</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          For remote hosts, use TCP/TLS mode instead. Prefer TLS or VPN-only access on your LAN.
        </p>
      </div>

      <Link
        href="/containers"
        className="inline-flex text-sm text-foreground underline underline-offset-4"
      >
        Open containers page
      </Link>
    </div>
  );
}

function DockerIntegrationCard({ provider }: { provider: ProviderPublicView }) {
  const initialMode =
    provider.config.mode === "tcp" || provider.config.mode === "tls"
      ? provider.config.mode
      : "local";

  const [enabled, setEnabled] = useState(provider.enabled);
  const [allowActions, setAllowActions] = useState(!provider.readOnly);
  const [connectionMode, setConnectionMode] = useState<DockerConnectionMode>(initialMode);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [configureState, configureAction, configurePending] = useActionState(
    configureDockerProviderAction,
    initialProviderActionState
  );
  const [testState, testAction, testPending] = useActionState(
    testDockerProviderAction,
    initialProviderActionState
  );

  const socketPath =
    typeof provider.config.socketPath === "string"
      ? provider.config.socketPath
      : "/var/run/docker.sock";
  const host = typeof provider.config.host === "string" ? provider.config.host : "127.0.0.1";
  const port =
    typeof provider.config.port === "number"
      ? String(provider.config.port)
      : connectionMode === "tls"
        ? "2376"
        : "2375";
  const statusMessage =
    testState.message || (provider.lastError && !testState.message ? provider.lastError : "");
  const statusOk = testState.message
    ? testState.ok
    : !provider.lastError && Boolean(provider.lastTestedAt);
  const testFormId = `docker-test-form-${provider.id}`;

  return (
    <div className="space-y-5 rounded-xl border border-border/80 bg-muted/10 p-4">
      <form action={configureAction} className="space-y-5">
        <input type="hidden" name="providerId" value={provider.id} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Label htmlFor={`docker-name-${provider.id}`}>Integration name</Label>
            <Input
              id={`docker-name-${provider.id}`}
              name="name"
              defaultValue={provider.name}
              maxLength={80}
              disabled={configurePending}
              placeholder="Docker host"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={configurePending || testPending}
          >
            <Trash2 />
            Remove
          </Button>
        </div>

        <ToggleRow
          id={`docker-enabled-${provider.id}`}
          label="Enable Docker integration"
          description="List containers from this local socket or remote Docker Engine API."
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={configurePending}
          hiddenName="enabled"
        />

        <ToggleRow
          id={`allow-actions-${provider.id}`}
          label="Allow container actions"
          description="Enable start, stop, and restart with confirmation prompts. Off by default."
          checked={allowActions}
          onCheckedChange={setAllowActions}
          disabled={configurePending}
          hiddenName="allowActions"
        />

        <div className="space-y-2">
          <Label htmlFor={`connectionMode-${provider.id}`}>Connection mode</Label>
          <select
            id={`connectionMode-${provider.id}`}
            name="connectionMode"
            value={connectionMode}
            onChange={(event) => setConnectionMode(event.target.value as DockerConnectionMode)}
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
            <Label htmlFor={`socketPath-${provider.id}`}>Docker socket path</Label>
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
              <Input
                id={`socketPath-${provider.id}`}
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
              <Label htmlFor={`host-${provider.id}`}>Host</Label>
              <Input
                id={`host-${provider.id}`}
                name="host"
                defaultValue={host}
                placeholder="192.168.1.10"
                disabled={configurePending}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`port-${provider.id}`}>Port</Label>
              <Input
                id={`port-${provider.id}`}
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
              <Label htmlFor={`tlsCa-${provider.id}`}>CA certificate</Label>
              <Textarea id={`tlsCa-${provider.id}`} name="tlsCa" rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`tlsCert-${provider.id}`}>Client certificate</Label>
              <Textarea id={`tlsCert-${provider.id}`} name="tlsCert" rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`tlsKey-${provider.id}`}>Client key</Label>
              <Textarea id={`tlsKey-${provider.id}`} name="tlsKey" rows={3} className="font-mono text-xs" />
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
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={testPending || !provider.enabled}
            form={testFormId}
          >
            {testPending ? "Testing..." : "Test connection"}
          </Button>
        </div>
      </form>

      <form id={testFormId} action={testAction} className="hidden">
        <input type="hidden" name="providerId" value={provider.id} />
      </form>

      {provider.enabled ? (
        <ConnectionState
          statusOk={statusOk}
          statusMessage={statusMessage}
          lastTestedAt={provider.lastTestedAt}
        />
      ) : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove {provider.name}?</DialogTitle>
            <DialogDescription>
              This removes the Docker integration from UniHomelabDash. It does not stop, delete, or change any Docker containers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={deleteDockerProviderAction} onSubmit={() => setDeleteOpen(false)}>
              <input type="hidden" name="providerId" value={provider.id} />
              <Button type="submit" variant="destructive">
                Remove integration
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToggleRow({
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
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <input type="hidden" name={hiddenName} value={checked ? "true" : "false"} />
    </div>
  );
}

function ConnectionState({
  statusOk,
  statusMessage,
  lastTestedAt,
}: {
  statusOk: boolean;
  statusMessage: string;
  lastTestedAt: string | null;
}) {
  return (
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
            {statusOk ? "Connected to Docker Engine" : statusMessage ? "Connection issue" : "Ready to test"}
          </p>
          {lastTestedAt ? (
            <p className="text-muted-foreground">
              Last tested {new Date(lastTestedAt).toLocaleString()}
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
  );
}
