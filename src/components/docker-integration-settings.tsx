"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Disclosure } from "@/components/disclosure";
import { ConnectionState, ToggleRow } from "@/components/integration-settings-shared";
import { PendingSubmitButton } from "@/components/pending-submit-button";
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
import { NativeSelect } from "@/components/ui/native-select";
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
    <section aria-labelledby="docker-integrations-heading" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 id="docker-integrations-heading" className="text-base font-medium">
            Docker
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect a local socket or a remote Docker Engine. Actions stay off until you allow them.
          </p>
        </div>
        <form action={createDockerProviderAction}>
          <PendingSubmitButton size="sm" icon={<Plus aria-hidden />} pendingLabel="Adding…">
            Add Docker
          </PendingSubmitButton>
        </form>
      </div>

      {providers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-4 text-sm text-muted-foreground">
          No Docker integrations yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <DockerIntegrationCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}

      <Disclosure
        summary="Local socket setup"
        description="Steps to mount the Docker socket into the UniHomelabDash container."
      >
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
        <p className="mt-3 text-sm text-muted-foreground">
          For remote hosts, use TCP/TLS mode instead. Prefer TLS or VPN-only access on your LAN.
        </p>
      </Disclosure>
    </section>
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
    <div className="space-y-5 rounded-xl border border-border/80 bg-card p-4">
      <form action={configureAction} className="space-y-5">
        <input type="hidden" name="providerId" value={provider.id} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2 sm:max-w-sm">
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
          <NativeSelect
            id={`connectionMode-${provider.id}`}
            name="connectionMode"
            value={connectionMode}
            onChange={(event) => setConnectionMode(event.target.value as DockerConnectionMode)}
            disabled={configurePending}
          >
            <option value="local">Local unix socket</option>
            <option value="tcp">Remote TCP</option>
            <option value="tls">Remote TCP with TLS</option>
          </NativeSelect>
        </div>

        {connectionMode === "local" ? (
          <div className="space-y-2">
            <Label htmlFor={`socketPath-${provider.id}`}>Docker socket path</Label>
            <Input
              id={`socketPath-${provider.id}`}
              name="socketPath"
              defaultValue={socketPath}
              placeholder="/var/run/docker.sock"
              disabled={configurePending}
              className="font-mono text-sm"
            />
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
          targetLabel="Docker Engine"
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
