"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Scheduled", variant: "secondary" },
  active: { label: "In Flight", variant: "default" },
  landed: { label: "Landed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  incident: { label: "Incident", variant: "destructive" },
  diverted: { label: "Diverted", variant: "destructive" },
  unknown: { label: "Unknown", variant: "secondary" },
};

export function FlightStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
