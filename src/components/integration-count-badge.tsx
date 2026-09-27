import { PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function IntegrationCountBadge({ count }: { count: number }) {
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <PlugZap aria-hidden />
      {count === 0 ? "Not connected" : count === 1 ? "1 integration" : `${count} integrations`}
    </Badge>
  );
}
