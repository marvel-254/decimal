import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PLAN_FEATURES: Record<string, string[]> = {
  "Starter": [
    "Programmes for your school",
    "Content builder",
    "Assessment tools",
    "Student enrolment",
    "Network participation",
  ],
  "Growth": [
    "All Starter features",
    "Live classes",
    "Advanced analytics",
    "Custom branding",
    "Priority support",
  ],
};

export const metadata = { title: "Upgrade to Tuition | Decimal" };

export default function TuitionUpgradePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tuition plans
        </h1>
        <p className="text-sm text-muted-foreground">
          Power your school's learning with the features you need.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Free</h3>
          </div>
          <ul className="mb-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Access for 1 school</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Basic content builder</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Student enrolment</span>
            </li>
          </ul>
          <Link href="/tuition">
            <Button variant="tuition" className="w-full">
              Start free
            </Button>
          </Link>
        </div>

        <div className="flex flex-col rounded-xl border-2 border-tuition-accent bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-tuition-accent">Growth plan</h3>
            <Badge variant="secondary">Recommended</Badge>
          </div>
          <ul className="mb-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Live classes & meetings</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Advanced analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Custom branding</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Priority support</span>
            </li>
          </ul>
          <Link href="/dashboard">
            <Button variant="default" className="w-full">
              Contact sales
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}