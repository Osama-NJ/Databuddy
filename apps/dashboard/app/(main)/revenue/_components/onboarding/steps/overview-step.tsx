"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface OverviewStepProps {
  onNext: () => void;
}

export function OverviewStep({ onNext }: OverviewStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">What you'll get:</h3>
        <ul className="space-y-2 text-blue-800 text-sm dark:text-blue-200">
          <li className="flex items-center gap-2">
            <CheckCircleIcon
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              size={16}
              weight="fill"
            />
            Real-time payment tracking
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              size={16}
              weight="fill"
            />
            Revenue analytics and trends
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              size={16}
              weight="fill"
            />
            Refund and chargeback monitoring
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              size={16}
              weight="fill"
            />
            Customer payment insights
          </li>
        </ul>
      </div>
      <Button className="w-full" onClick={onNext}>
        Start Integration
      </Button>
    </div>
  );
}
