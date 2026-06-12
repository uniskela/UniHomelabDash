"use client";

import { useState } from "react";
import { HeartPulse, Plus } from "lucide-react";
import type { ManualService } from "@/lib/services/types";
import { checkAllServiceHealthAction } from "@/lib/services/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ServiceCard } from "@/components/service-card";
import { ServiceForm } from "@/components/service-form";

export function ServiceManager({
  services,
  initialAddOpen = false,
}: {
  services: ManualService[];
  initialAddOpen?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(initialAddOpen);
  const [editing, setEditing] = useState<ManualService | null>(null);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            {services.length} {services.length === 1 ? "service" : "services"}
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Keep your most-used homelab links, notes, and health checks in
              one place.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={checkAllServiceHealthAction}>
            <Button type="submit" variant="outline">
              <HeartPulse />
              Check all
            </Button>
          </form>

          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus />
                Add service
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Add service</SheetTitle>
                <SheetDescription>
                  Save a link, host, category, and optional notes.
                </SheetDescription>
              </SheetHeader>
              <ServiceForm onSaved={() => setCreateOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </section>

      {services.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Start with one service</CardTitle>
            <CardDescription>
              Add the first service you want at your fingertips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              Add first service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onEdit={setEditing} />
          ))}
        </div>
      )}

      <Sheet open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit service</SheetTitle>
            <SheetDescription>
              Update the link, health check URL, and notes for this service.
            </SheetDescription>
          </SheetHeader>
          {editing ? (
            <ServiceForm service={editing} onSaved={() => setEditing(null)} />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
