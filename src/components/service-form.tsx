"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ManualService } from "@/lib/services/types";
import {
  createServiceAction,
  updateServiceAction,
} from "@/lib/services/actions";
import { initialActionState } from "@/lib/services/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ServiceForm({
  service,
  defaults,
  onSaved,
}: {
  service?: ManualService;
  defaults?: Partial<
    Pick<ManualService, "name" | "category" | "icon" | "host" | "notes" | "healthUrl">
  >;
  onSaved: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = service ? updateServiceAction : createServiceAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.ok) {
      if (!service) {
        formRef.current?.reset();
      }
      onSaved();
    }
  }, [onSaved, service, state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}

      <Field label="Name" htmlFor="name" required>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={service?.name ?? defaults?.name}
          placeholder="Jellyfin"
        />
      </Field>

      <Field label="URL" htmlFor="url" required>
        <Input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={service?.url}
          placeholder="https://jellyfin.example.local"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <Input
            id="category"
            name="category"
            maxLength={50}
            defaultValue={service?.category ?? defaults?.category ?? "General"}
            placeholder="Media"
          />
        </Field>

        <Field label="Icon text" htmlFor="icon">
          <Input
            id="icon"
            name="icon"
            maxLength={8}
            defaultValue={service?.icon ?? defaults?.icon}
            placeholder="JF"
          />
        </Field>
      </div>

      <Field label="Host" htmlFor="host">
        <Input
          id="host"
          name="host"
          maxLength={80}
          defaultValue={service?.host ?? defaults?.host}
          placeholder="docker-01"
        />
      </Field>

      <Field
        label="Health check URL"
        htmlFor="healthUrl"
        hint="Optional. Use the service URL or a dedicated endpoint such as /health. Leave empty to skip checks."
      >
        <Input
          id="healthUrl"
          name="healthUrl"
          type="url"
          defaultValue={service?.healthUrl ?? defaults?.healthUrl}
          placeholder="https://jellyfin.example.local/health"
        />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          maxLength={500}
          defaultValue={service?.notes ?? defaults?.notes}
          placeholder="Runs on the media VM. Manual entry only."
          rows={4}
        />
      </Field>

      {state.message ? (
        <p className={state.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : service ? "Save changes" : "Create service"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
