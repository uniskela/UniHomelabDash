"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/lib/auth/types";
import { changePasswordAction } from "@/lib/auth/actions";

const initialState: AuthActionState = { ok: false, message: "" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 border-t border-border pt-4">
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">Change password</div>
        <p className="text-sm text-muted-foreground">
          Update your admin password while signed in.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
        />
      </div>

      {state.message ? (
        <p
          className={`text-sm ${state.ok ? "text-muted-foreground" : "text-destructive"}`}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
