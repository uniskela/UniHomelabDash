"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandIcon } from "@/components/brand-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/lib/auth/types";
import { loginAction } from "@/lib/auth/actions";
import { sanitizeLocalRedirectPath } from "@/lib/auth/safe-redirect-path";

const initialState: AuthActionState = { ok: false, message: "" };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (state.ok && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      const next = sanitizeLocalRedirectPath(searchParams.get("next"));
      router.replace(next);
    }
  }, [state.ok, searchParams, router]);

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center py-8">
      <div className="mb-6 flex items-center justify-center gap-3">
        <BrandIcon className="size-10 rounded-xl" />
        <div>
          <h1 className="text-xl font-semibold">UniHomelabDash</h1>
          <p className="text-sm text-muted-foreground">Sign in</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
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

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
