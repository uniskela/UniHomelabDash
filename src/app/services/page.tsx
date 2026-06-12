import { ServiceManager } from "@/components/service-manager";
import { listServices } from "@/lib/services/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const params = await searchParams;
  const services = await listServices();

  return (
    <ServiceManager services={services} initialAddOpen={params.add === "1"} />
  );
}
