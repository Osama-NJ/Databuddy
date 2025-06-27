"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error occurred:", error);
  }, [error]);

  const handleGoToHomepage = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="max-w-md text-center">
        <WarningCircleIcon
          className="mx-auto mb-6 h-16 w-16 text-destructive"
          size={64}
          weight="duotone"
        />
        <h1 className="mb-3 font-semibold text-3xl">Something went wrong</h1>
        <p className="mb-1 text-muted-foreground">
          We encountered an unexpected issue. Please try again.
        </p>
        {error?.message && (
          <p className="my-3 rounded-md bg-destructive/20 p-2 text-destructive-foreground text-sm">
            Error details: {error.message}
          </p>
        )}
        <Button className="mt-6" onClick={() => reset()} size="lg">
          Try again
        </Button>
        <Button className="mt-3 ml-3" onClick={handleGoToHomepage} size="lg" variant="outline">
          Go to Homepage
        </Button>
      </div>
    </div>
  );
}
