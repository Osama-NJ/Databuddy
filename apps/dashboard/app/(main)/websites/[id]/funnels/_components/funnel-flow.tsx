"use client";

import { CaretDownIcon, TargetIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

interface FunnelStep {
  step_number: number;
  step_name: string;
  users: number;
  conversion_rate?: number;
  dropoff_rate?: number;
  avg_time_to_complete?: number;
  dropoffs?: number;
}

interface FunnelFlowProps {
  steps: FunnelStep[];
  totalUsers: number;
  formatCompletionTime: (seconds: number) => string;
}

export function FunnelFlow({ steps, totalUsers, formatCompletionTime }: FunnelFlowProps) {
  if (!steps.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        No funnel data available.
      </div>
    );
  }

  const maxUsers = Math.max(...steps.map((s) => s.users));
  const firstStep = steps[0];
  const lastStep = steps[steps.length - 1];
  const overallConversion = totalUsers > 0 ? ((lastStep?.users || 0) / totalUsers) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TargetIcon className="h-4 w-4 text-primary" size={16} weight="duotone" />
        <h3 className="font-semibold text-base text-foreground">Funnel Steps</h3>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => {
          const isFirstStep = index === 0;
          const prevStep = index > 0 ? steps[index - 1] : null;
          const droppedUsers = prevStep ? prevStep.users - step.users : 0;
          const relConversion = prevStep && prevStep.users > 0 ? (step.users / prevStep.users) * 100 : 100;
          const absConversion = firstStep && firstStep.users > 0 ? (step.users / firstStep.users) * 100 : 100;
          const barWidth = Math.max((step.users / maxUsers) * 100, 5);

          return (
            <div key={step.step_number} className="relative pb-6">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground mr-2">
                  {step.step_number}
                </div>
                <div className="font-medium text-base text-foreground truncate">{step.step_name}</div>
              </div>

              <div className="flex items-center pl-8">
                <div className="flex-shrink-0 min-w-[120px] mr-4">
                  <span className="text-lg font-semibold text-foreground">{step.users.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">users</span>
                </div>
                <div className="flex-grow h-8 bg-muted relative overflow-hidden">
                  {index > 0 && prevStep && (
                    <div
                      className="absolute left-0 top-0 h-full"
                      style={{
                        width: `${relConversion}%`,
                        backgroundImage:
                          'repeating-linear-gradient(135deg, var(--color-success) 0 4px, transparent 4px 8px)',
                        opacity: 0.18,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <div
                    className="absolute left-0 top-0 h-full bg-primary"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="absolute top-1 right-3 z-20 flex flex-col items-end">
                    <span className="text-base font-semibold text-foreground">{step.conversion_rate?.toFixed(1) ?? absConversion.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {index !== 0 && droppedUsers > 0 && (
                <div className="pl-8 flex mt-1">
                  <div className="min-w-[140px] mr-4">
                    <span className="text-xs font-medium text-destructive">-{droppedUsers.toLocaleString()} dropped</span>
                  </div>
                </div>
              )}

              {index < steps.length - 1 && (
                <div className="absolute left-[11px] -bottom-6 top-6 flex flex-col items-center">
                  <div className="h-full w-0.5 bg-muted" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded border bg-muted/30 p-4 flex items-center justify-between">
        <div>
          <div className="font-medium text-foreground">Overall Conversion</div>
          <div className="text-muted-foreground text-xs">
            {lastStep?.users?.toLocaleString() || 0} of {totalUsers.toLocaleString()} users completed the funnel
          </div>
        </div>
        <div className="font-bold text-2xl text-primary">{overallConversion.toFixed(1)}%</div>
      </div>
    </div>
  );
}
