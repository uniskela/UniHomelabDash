import { ServiceManager } from "@/components/service-manager";
import { listServices } from "@/lib/services/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ServiceSearchParams = {
  add?: string;
  name?: string;
  category?: string;
  icon?: string;
  host?: string;
  notes?: string;
  healthUrl?: string;
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<ServiceSearchParams>;
}) {
  const params = await searchParams;
  const services = await listServices();
  const serviceDefaults = {
    name: limitParam(params.name, 80),
    category: limitParam(params.category, 50),
    icon: limitParam(params.icon, 8),
    host: limitParam(params.host, 80),
    notes: limitParam(params.notes, 500),
    healthUrl: limitParam(params.healthUrl, 300),
  };

  return (
    <ServiceManager
      services={services}
      initialAddOpen={params.add === "1"}
      serviceDefaults={serviceDefaults}
    />
  );
}

function limitParam(value: string | undefined, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
}
