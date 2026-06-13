import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { isAuthDisabled } from "@/lib/auth/constants";
import { isSetupComplete } from "@/lib/settings/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LoginPage() {
  if (!isAuthDisabled() && !isSetupComplete()) {
    redirect("/setup");
  }

  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
