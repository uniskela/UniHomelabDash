"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, ShieldAlert, Trash2, XCircle } from "lucide-react";
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
  configurePortainerProviderAction,
  createPortainerProviderAction,
  deletePortainerProviderAction,
  testPortainerProviderAction,
} from "@/lib/providers/actions";
import { initialProviderActionState } from "@/lib/providers/action-state";
import type { ProviderPublicView } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

export function PortainerIntegrationSettings({
  providers,
}: {
  providers: ProviderPublicView[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Configure one or more Portainer API connections.</p>
          <p>Portainer integrations are read-only in this release.</p>
        </div>
        <form action={createPortainerProviderAction}>
          <Button type="submit" size="sm">
            <Plus />
            Add Portainer integration
          </Button>
        </form>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground">
          No Portainer integrations configured yet. Add one with a base URL and API access token.
        </div>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <PortainerIntegrationCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border/80 bg-card/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Security guidance</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Use a dedicated Portainer user and least-privilege team permissions.</li>
          <li>Prefer HTTPS on port 9443 and avoid exposing Portainer publicly.</li>
          <li>Token and optional CA certificate are encrypted server-side.</li>
        </ul>
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

function PortainerIntegrationCard({ provider }: { provider: ProviderPublicView }) {
  const [enabled, setEnabled] = useState(provider.enabled);
  const [clearToken, setClearToken] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [configureState, configureAction, configurePending] = useActionState(
    configurePortainerProviderAction,
    initialProviderActionState
  );
  const [testState, testAction, testPending] = useActionState(
    testPortainerProviderAction,
    initialProviderActionState
  );

  const baseUrl = typeof provider.config.baseUrl === "string" ? provider.config.baseUrl : "";
  const statusMessage =
    testState.message || (provider.lastError && !testState.message ? provider.lastError : "");
  const statusOk = testState.message
    ? testState.ok
    : !provider.lastError && Boolean(provider.lastTestedAt);
  const testFormId = `portainer-test-form-${provider.id}`;

  return (
    <div className="space-y-5 rounded-xl border border-border/80 bg-muted/10 p-4">
      <form action={configureAction} className="space-y-5">
        <input type="hidden" name="providerId" value={provider.id} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Label htmlFor={`portainer-name-${provider.id}`}>Integration name</Label>
            <Input
              id={`portainer-name-${provider.id}`}
              name="name"
              defaultValue={provider.name}
              maxLength={80}
              disabled={configurePending}
              placeholder="Portainer host"
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
          id={`portainer-enabled-${provider.id}`}
          label="Enable Portainer integration"
          description="List containers via Portainer endpoint gateways."
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={configurePending}
          hiddenName="enabled"
        />

        <div className="space-y-2">
          <Label htmlFor={`portainer-url-${provider.id}`}>Portainer base URL</Label>
          <Input
            id={`portainer-url-${provider.id}`}
            name="baseUrl"
            defaultValue={baseUrl}
            placeholder="https://portainer.local:9443"
            disabled={configurePending}
            className="font-mono text-sm"
          />
          {baseUrl.startsWith("http://") ? (
            <p className="flex items-center gap-2 text-xs text-amber-300">
              <ShieldAlert className="size-3.5 shrink-0" />
              HTTP detected. Prefer HTTPS whenever possible.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
          <Label htmlFor={`portainer-token-${provider.id}`}>Access token</Label>
          <Input
            id={`portainer-token-${provider.id}`}
            name="apiKey"
            type="password"
            placeholder="Paste a new token to replace the stored token"
            disabled={configurePending}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to keep the current token.
          </p>
          <ToggleRow
            id={`portainer-clear-token-${provider.id}`}
            label="Clear stored token"
            description="Turn this on and save if you want to remove the stored token."
            checked={clearToken}
            onCheckedChange={setClearToken}
            disabled={configurePending}
            hiddenName="clearToken"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`portainer-ca-${provider.id}`}>Custom CA certificate (optional)</Label>
          <Textarea
            id={`portainer-ca-${provider.id}`}
            name="caCert"
            rows={3}
            className="font-mono text-xs"
            placeholder="Paste PEM to trust a self-signed certificate"
          />
        </div>

        {configureState.message ? (
          <p
            className={cn("text-sm", configureState.ok ? "text-muted-foreground" : "text-destructive")}
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
              This removes the Portainer integration from UniHomelabDash. It does not alter your
              Portainer server, endpoints, stacks, or containers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={deletePortainerProviderAction} onSubmit={() => setDeleteOpen(false)}>
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
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {statusOk ? "Connected to Portainer" : statusMessage ? "Connection issue" : "Ready to test"}
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
