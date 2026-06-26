"use client";

import { useState } from "react";
import { HeartPulse, Plus, Server } from "lucide-react";
import type { ManualService } from "@/lib/services/types";
import { checkAllServiceHealthAction } from "@/lib/services/actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ServiceCard } from "@/components/service-card";
import { ServiceForm } from "@/components/service-form";

export function ServiceManager({
  services,
  initialAddOpen = false,
  serviceDefaults,
}: {
  services: ManualService[];
  initialAddOpen?: boolean;
  serviceDefaults?: Partial<Pick<ManualService, "name" | "category" | "icon" | "host" | "notes" | "healthUrl">>;
}) {
  const [createOpen, setCreateOpen] = useState(initialAddOpen);
  const [editing, setEditing] = useState<ManualService | null>(null);

  const eyebrow =
    services.length === 1 ? "1 service" : `${services.length} services`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={eyebrow}
        title="Services"
        description="Keep your most-used homelab links, notes, and health checks in one place."
        actions={
          <>
            <form action={checkAllServiceHealthAction}>
              <Button type="submit" variant="outline">
                <HeartPulse />
                Check all
              </Button>
            </form>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus />
                  Add service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add service</DialogTitle>
                  <DialogDescription>
                    Save a link, host, category, and optional notes.
                  </DialogDescription>
                </DialogHeader>
                <ServiceForm defaults={serviceDefaults} onSaved={() => setCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {services.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Start with one service"
          description="Add the first service you want at your fingertips."
          actionLabel="Add first service"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onEdit={setEditing} />
          ))}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
            <DialogDescription>
              Update the link, health check URL, and notes for this service.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <ServiceForm service={editing} onSaved={() => setEditing(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
