import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Monitoring · Runway" };

// Metrics, logs and events come from the cloud's native tools in Phase 7.
export default function MonitoringPage() {
  return (
    <EmptyState
      title="No live services yet"
      body="Monitoring starts after your first successful deployment. Metrics and logs are pulled from your cloud provider."
    />
  );
}
