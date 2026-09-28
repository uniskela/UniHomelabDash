"use client";

import { useActionState, useState } from "react";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
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
    <section aria-labelledby="portainer-integrations-heading" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 id="portainer-integrations-heading" className="text-base font-medium">
            Portainer
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect with a base URL and API access token. Actions stay off until you allow them.
          </p>
        </div>
        <form action={createPortainerProviderAction}>
          <PendingSubmitButton size="sm" icon={<Plus aria-hidden />} pendingLabel="Adding…">
            Add Portainer
          </PendingSubmitButton>
        </form>
      </div>

      {providers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-4 text-sm text-muted-foreground">
          No Portainer integrations yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <PortainerIntegrationCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}

      <Disclosure
        summary="Security guidance"
        description="How to scope the Portainer token safely."
      >
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Use a dedicated Portainer user and least-privilege team permissions.</li>
          <li>Prefer HTTPS on port 9443 and avoid exposing Portainer publicly.</li>
          <li>Token and optional CA certificate are encrypted server-side.</li>
        </ul>
      </Disclosure>
    </section>
  );
}

function PortainerIntegrationCard({ provider }: { provider: ProviderPublicView }) {
  const [enabled, setEnabled] = useState(provider.enabled);
  const [allowActions, setAllowActions] = useState(!provider.readOnly);
  const [clearToken, setClearToken] = useState(false);
  const [clearCaCert, setClearCaCert] = useState(false);
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
    <div className="space-y-5 rounded-xl border border-border/80 bg-card p-4">
      <form action={configureAction} className="space-y-5">
        <input type="hidden" name="providerId" value={provider.id} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2 sm:max-w-sm">
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

        <ToggleRow
          id={`portainer-allow-actions-${provider.id}`}
          label="Allow container actions"
          description="Enable start, stop, and restart with confirmation prompts. Off by default."
          checked={allowActions}
          onCheckedChange={setAllowActions}
          disabled={configurePending}
          hiddenName="allowActions"
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
            <p className="flex items-center gap-2 text-xs text-warning">
              <ShieldAlert className="size-3.5 shrink-0" />
              HTTP detected. Prefer HTTPS whenever possible.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3 sm:p-4">
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
            disabled={configurePending || clearCaCert}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to keep any stored CA. Use clear below to return to the system trust store.
          </p>
          <ToggleRow
            id={`portainer-clear-ca-${provider.id}`}
            label="Clear stored CA certificate"
            description="Turn this on and save to stop trusting a previously stored custom CA."
            checked={clearCaCert}
            onCheckedChange={setClearCaCert}
            disabled={configurePending}
            hiddenName="clearCaCert"
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
          targetLabel="Portainer"
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
