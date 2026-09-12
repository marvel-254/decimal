import { Rocket } from "lucide-react";
import { EmptyState } from "@/components/tuition/empty-state";

export default function TuitionComingSoonPage() {
  return (
    <EmptyState
      icon={Rocket}
      title="This module arrives in a later slice"
      description="The Decimal Tuition build ships in phases. This corner of the product isn't open yet — come back after the next release."
      actionHref="/tuition"
      actionLabel="Back to Tuition"
    />
  );
}