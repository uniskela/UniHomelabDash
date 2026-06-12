import Link from "next/link";
import { Bell, Download, HeartPulse, LockKeyhole } from "lucide-react";
import { SettingsAdvanced } from "@/components/settings-advanced";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDatabasePath } from "@/lib/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <Badge variant="secondary" className="w-fit">
          Settings
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Install the app, review health checks, and see what is coming next.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              Install app
            </CardTitle>
            <CardDescription>
              Add UniHomelabDash to your home screen or desktop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>iPhone/iPad Safari: Share, then Add to Home Screen.</p>
            <p>Android Chrome: browser menu, then Install app or Add to Home screen.</p>
            <p>Desktop Chrome/Edge: use the install icon in the address bar or browser menu.</p>
            <p>
              iOS and Android may require <strong>HTTPS</strong> for full PWA install and service
              worker support when not using localhost. Use a reverse proxy with TLS on your homelab
              host, or test install from localhost during development.
            </p>
            <p>
              For the closest experience to production, use{" "}
              <code className="text-xs">docker compose up --build</code> on your homelab host.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-5" />
              Health checks
            </CardTitle>
            <CardDescription>
              On-demand HTTP checks for services you configure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Add a health check URL when editing a service. Use the service root URL or a
              dedicated endpoint such as <code className="text-xs">/health</code>.
            </p>
            <p>
              Checks run when you tap Check or Check all. LAN-only URLs must be reachable from
              the machine running UniHomelabDash.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              Alerts
            </CardTitle>
            <CardDescription>Notifications are not available yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="size-5" />
              Authentication
            </CardTitle>
            <CardDescription>Coming in a future release.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Login and access control will be added before privileged integrations such as
            Docker actions are enabled.
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <SettingsAdvanced databasePath={getDatabasePath()} />
        </div>
      </div>
    </div>
  );
}
