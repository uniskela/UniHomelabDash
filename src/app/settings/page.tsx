import Link from "next/link";
import { Bell, Download, HeartPulse, LockKeyhole, PlugZap, ShieldAlert } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { DockerIntegrationSettings } from "@/components/docker-integration-settings";
import { PageHeader } from "@/components/page-header";
import { SettingsAdvanced } from "@/components/settings-advanced";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isHttpsRequest } from "@/lib/request/https";
import { isAuthDisabled } from "@/lib/auth/constants";
import { getSessionUser } from "@/lib/auth/session-user";
import { getDatabasePath } from "@/lib/db/client";
import { getDockerProviderAction } from "@/lib/providers/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();
  const httpsEnabled = await isHttpsRequest();
  const authDisabled = isAuthDisabled();
  const dockerProvider = await getDockerProviderAction();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="Install the app, review health checks, and manage access to your dashboard."
      />

      {!httpsEnabled && !authDisabled ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-100">
              <ShieldAlert className="size-5 text-amber-400" />
              Exposure warning
            </CardTitle>
            <CardDescription>
              This request is not using HTTPS. Prefer a reverse proxy with TLS before exposing
              UniHomelabDash beyond your LAN.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Put the app behind nginx, Caddy, or Traefik with HTTPS. Add access control such as
            Authelia, Authentik, or VPN-only access when reachable from untrusted networks.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              Install app
            </CardTitle>
            <CardDescription>
              Add UniHomelabDash to your home screen or desktop.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>iPhone/iPad Safari: Share, then Add to Home Screen.</li>
              <li>Android Chrome: browser menu, then Install app or Add to Home screen.</li>
              <li>Desktop Chrome/Edge: use the install icon in the address bar or browser menu.</li>
              <li>
                iOS and Android may require HTTPS for full PWA install when not using localhost.
              </li>
              <li>
                For production-like testing, use{" "}
                <code className="text-xs">docker compose up --build</code> on your homelab host.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-5" />
              Health checks
            </CardTitle>
            <CardDescription>
              On-demand HTTP checks for services you configure.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Add a health check URL when editing a service (root URL or{" "}
                <code className="text-xs">/health</code>).
              </li>
              <li>Checks run when you tap Check or Check all.</li>
              <li>
                LAN-only URLs must be reachable from the machine running UniHomelabDash.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="size-5" />
              Integrations
            </CardTitle>
            <CardDescription>
              Connect homelab providers behind authentication. Docker supports read-only status, optional actions, and remote TCP/TLS.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <DockerIntegrationSettings
              key={`${dockerProvider?.id ?? "new"}-${dockerProvider?.enabled}-${dockerProvider?.lastTestedAt ?? ""}`}
              provider={dockerProvider}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              Alerts
            </CardTitle>
            <CardDescription>Notifications are not available yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
            <p>
              Use dashboard health checks today. Alerts for push notifications and provider
              events will arrive in a later release.
            </p>
            <Link href="/alerts" className="text-foreground underline underline-offset-4">
              View alerts roadmap
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="size-5" />
              Authentication
            </CardTitle>
            <CardDescription>
              {authDisabled
                ? "Authentication is disabled for development."
                : "Sign-in is required for dashboard access."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
            {authDisabled ? (
              <p>
                <code className="text-xs">AUTH_DISABLED=true</code> bypasses login. Do not use
                this in production.
              </p>
            ) : (
              <>
                <p>
                  Signed in as <strong className="text-foreground">{sessionUser?.username}</strong>.
                </p>
                <LogoutButton />
                <ChangePasswordForm />
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <SettingsAdvanced databasePath={getDatabasePath()} authEnabled={!authDisabled} />
        </div>
      </div>
    </div>
  );
}
