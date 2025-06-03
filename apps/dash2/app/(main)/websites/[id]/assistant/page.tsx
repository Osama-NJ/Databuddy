"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { WebsiteDataTabProps } from "../_components/utils/types";

// Lazy load the main AI assistant component
const AIAssistantMain = dynamic(
  () => import("./components/ai-assistant-main"),
  { 
    loading: () => <AIAssistantLoadingSkeleton />,
    ssr: false 
  }
);

function AIAssistantLoadingSkeleton() {
  return (
    <div className="h-[calc(100vh-200px)] grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chat Section Skeleton */}
      <div className="rounded-lg border bg-background shadow-sm flex flex-col h-full">
        <div className="p-6 border-b">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-20 w-3/4 rounded-lg" />
          </div>
          <div className="flex gap-3 ml-auto flex-row-reverse">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-12 w-1/2 rounded-lg" />
          </div>
        </div>
        <div className="p-6 border-t">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Visualization Section Skeleton */}
      <div className="rounded-lg border bg-background shadow-sm flex flex-col h-full">
        <div className="p-6 border-b">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex-1 p-6">
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function WebsiteAIAssistantTab(props: WebsiteDataTabProps) {
  return (
    <Suspense fallback={<AIAssistantLoadingSkeleton />}>
      <AIAssistantMain {...props} />
    </Suspense>
  );
} 