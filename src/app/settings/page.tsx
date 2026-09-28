import Link from "next/link";
import { ArrowRight, Download, HeartPulse, LockKeyhole, PlugZap, ShieldAlert } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { DockerIntegrationSettings } from "@/components/docker-integration-settings";
import { PortainerIntegrationSettings } from "@/components/portainer-integration-settings";
import { PageHeader } from "@/components/page-header";
import { SettingsAdvanced } from "@/components/settings-advanced";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isHttpsRequest } from "@/lib/request/https";
import { isAuthDisabled } from "@/lib/auth/constants";
import { requireAuth } from "@/lib/auth/session-user";
import { getDatabasePath } from "@/lib/db/client";
import { getDockerProvidersAction, getPortainerProvidersAction } from "@/lib/providers/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sections = [
  { id: "integrations", label: "Integrations" },
  { id: "account", label: "Account" },
  { id: "app", label: "App & checks" },
  { id: "advanced", label: "Advanced" },
];

export default async function SettingsPage() {
  const sessionUser = await requireAuth();
  const httpsEnabled = await isHttpsRequest();
  const authDisabled = isAuthDisabled();
  const dockerProviders = await getDockerProvidersAction();
  const portainerProviders = await getPortainerProvidersAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Connect integrations, manage your admin account, and install the app."
      />

      <nav aria-label="Settings sections">
        <ul className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex min-h-9 items-center rounded-full border border-border/80 px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:min-h-10"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {!httpsEnabled && !authDisabled ? (
        <div
          role="note"
          className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm"
        >
          <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="space-y-1">
            <p className="font-medium">This connection is not using HTTPS</p>
            <p className="text-muted-foreground">
              Put UniHomelabDash behind a reverse proxy with TLS (nginx, Caddy, or Traefik) before
              exposing it beyond your LAN, and add access control such as Authelia, Authentik, or
              VPN-only access.
            </p>
          </div>
        </div>
      ) : null}

      <Card id="integrations">
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <PlugZap aria-hidden className="size-5" />
              Integrations
            </CardTitle>
            <CardDescription>
              Show containers and stacks from Docker and Portainer. Every integration starts
              read-only.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href="/containers">
              Open containers
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <DockerIntegrationSettings providers={dockerProviders} />
          <Separator />
          <PortainerIntegrationSettings providers={portainerProviders} />
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card id="account">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole aria-hidden className="size-5" />
              Account
            </CardTitle>
            <CardDescription>
              {authDisabled
                ? "Authentication is disabled for development."
                : "Sign-in is required for dashboard access."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {authDisabled ? (
              <p>
                <code className="text-xs">AUTH_DISABLED=true</code> bypasses login. Do not use
                this in production.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>
                    Signed in as{" "}
                    <strong className="text-foreground">{sessionUser?.username}</strong>
                  </p>
                  <LogoutButton />
                </div>
                <ChangePasswordForm />
              </>
            )}
          </CardContent>
        </Card>

        <div id="app" className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download aria-hidden className="size-5" />
                Install app
              </CardTitle>
              <CardDescription>Add UniHomelabDash to your home screen or desktop.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <InstallStep device="iPhone and iPad" steps="Safari → Share → Add to Home Screen" />
                <InstallStep device="Android" steps="Chrome menu → Install app" />
                <InstallStep device="Desktop" steps="Install icon in the Chrome or Edge address bar" />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Phones may require HTTPS to install when you are not on localhost.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse aria-hidden className="size-5" />
                Health checks
              </CardTitle>
              <CardDescription>On-demand HTTP checks for services you configure.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Add a health check URL when editing a service (the root URL or{" "}
                  <code className="text-xs">/health</code>).
                </li>
                <li>Checks run when you tap Check or Check all. Nothing runs in the background.</li>
                <li>LAN-only URLs must be reachable from the machine running UniHomelabDash.</li>
                <li>
                  Background alerts and notifications are planned.{" "}
                  <Link href="/alerts" className="text-foreground underline underline-offset-4">
                    See what is coming
                  </Link>
                  .
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div id="advanced">
        <SettingsAdvanced databasePath={getDatabasePath()} authEnabled={!authDisabled} />
      </div>
    </div>
  );
}

function InstallStep({ device, steps }: { device: string; steps: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="font-medium text-foreground">{device}</dt>
      <dd className="text-muted-foreground">{steps}</dd>
    </div>
  );
}
