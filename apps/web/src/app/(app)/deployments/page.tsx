import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Deployments · AiOps" };

// Real deployments are listed from the API once the deploy workflow lands (Phases 2 and 5).
export default function DeploymentsPage() {
  return (
    <EmptyState
      title="No deployments yet"
      body="Every deployment you start shows up here with its logs and outcome."
    />
  );
}
