"use client";

import { Loader2Icon, UsersIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInfiniteAnalyticsSessions } from "@/hooks/use-analytics";
import { WebsitePageHeader } from "../../_components/website-page-header";
import { SessionRow } from "./session-row";
import { getDefaultDateRange } from "./session-utils";

interface SessionsListProps {
  websiteId: string;
}

export function SessionsList({ websiteId }: SessionsListProps) {
  const [dateRange] = useState(() => getDefaultDateRange());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useInfiniteAnalyticsSessions(websiteId, dateRange, 25);

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessionId((currentId) => (currentId === sessionId ? null : sessionId));
  }, []);

  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    if (!loadMoreRef) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "200px",
    });

    observer.observe(loadMoreRef);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreRef, handleIntersection]);

  const allSessions = useMemo(() => {
    return data?.pages.flatMap((page) => page.sessions) || [];
  }, [data?.pages]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <WebsitePageHeader
          title="Recent Sessions"
          description="User sessions with event timelines and custom event properties"
          icon={<UsersIcon className="h-6 w-6 text-primary" />}
          websiteId={websiteId}
          variant="minimal"
        />
        <Card>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div className="h-16 animate-pulse rounded bg-muted/20" key={i} />
              ))}
            </div>
            <div className="flex items-center justify-center pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading sessions...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <WebsitePageHeader
          title="Recent Sessions"
          description="User sessions with event timelines and custom event properties"
          icon={<UsersIcon className="h-6 w-6 text-primary" />}
          websiteId={websiteId}
          variant="minimal"
          hasError={true}
          errorMessage={error?.message || "Failed to load sessions"}
        />
      </div>
    );
  }

  if (!allSessions || allSessions.length === 0) {
    return (
      <div className="space-y-6">
        <WebsitePageHeader
          title="Recent Sessions"
          description="User sessions with event timelines and custom event properties"
          icon={<UsersIcon className="h-6 w-6 text-primary" />}
          websiteId={websiteId}
          variant="minimal"
        />
        <Card>
          <CardContent>
            <div className="py-12 text-center text-muted-foreground">
              <UsersIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2 font-medium text-lg">No sessions found</p>
              <p className="text-sm">Sessions will appear here once users visit your website</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WebsitePageHeader
        title="Recent Sessions"
        description="User sessions with event timelines and custom event properties"
        icon={<UsersIcon className="h-6 w-6 text-primary" />}
        websiteId={websiteId}
        variant="minimal"
        subtitle={`${allSessions.length} loaded`}
      />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {allSessions.map((session, index) => (
              <SessionRow
                index={index}
                isExpanded={expandedSessionId === session.session_id}
                key={session.session_id || index}
                onToggle={toggleSession}
                session={session}
              />
            ))}
          </div>

          {/* Load More Trigger */}
          <div className="border-border border-t p-4">
            {hasNextPage ? (
              <div className="flex justify-center" ref={setLoadMoreRef}>
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading more sessions...</span>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => fetchNextPage()} variant="outline">
                    Load More Sessions
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">All sessions loaded</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
