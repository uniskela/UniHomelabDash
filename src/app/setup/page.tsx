import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/auth/setup-form";
import { isAuthDisabled } from "@/lib/auth/constants";
import { isSetupComplete } from "@/lib/settings/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SetupPage() {
  if (!isAuthDisabled() && isSetupComplete()) {
    redirect("/api/auth/sync-setup");
  }

  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>}>
      <SetupForm />
    </Suspense>
  );
}
