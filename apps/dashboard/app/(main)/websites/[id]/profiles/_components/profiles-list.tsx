"use client";

import { Loader2Icon, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfilesData } from "@/hooks/use-dynamic-query";
import type { ProfileData as AnalyticsProfileData } from "@/hooks/use-analytics";

// Type adapter for the new profile data structure
type ProfileData = {
  visitor_id: string;
  first_visit: string;
  last_visit: string;
  total_sessions: number;
  total_pageviews: number;
  total_duration: number;
  total_duration_formatted: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  region: string;
  sessions: any[];
};
import { WebsitePageHeader } from "../../_components/website-page-header";
import { ProfileRow } from "./profile-row";
import { getDefaultDateRange } from "./profile-utils";

interface ProfilesListProps {
  websiteId: string;
}

export function ProfilesList({ websiteId }: ProfilesListProps) {
  const [dateRange] = useState(() => getDefaultDateRange());
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasIntersected, setHasIntersected] = useState(false);

  const { profiles, pagination, isLoading, isError, error } =
    useProfilesData(websiteId, dateRange, 25, page);

  const toggleProfile = useCallback((profileId: string) => {
    setExpandedProfileId(currentId => currentId === profileId ? null : profileId);
  }, []);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && pagination.hasNext && !isLoading) {
        setHasIntersected(true);
        setPage(prev => prev + 1);
      }
    },
    [pagination.hasNext, isLoading]
  );

  useEffect(() => {
    if (!loadMoreRef) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "300px",
    });

    observer.observe(loadMoreRef);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreRef, handleIntersection]);

  useEffect(() => {
    if (profiles?.length) {
      setAllProfiles(prev => {
        const existingProfiles = new Map(prev.map(p => [p.visitor_id, p]));
        for (const profile of profiles) {
          if (!existingProfiles.has(profile.visitor_id)) {
            existingProfiles.set(profile.visitor_id, profile);
          }
        }
        return Array.from(existingProfiles.values());
      });
      setIsInitialLoad(false);
    }
  }, [profiles]);

  useEffect(() => {
    if (pagination.hasNext && !isLoading && !isInitialLoad && !hasIntersected) {
      const timer = setTimeout(() => {
        setShowLoadMore(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    setShowLoadMore(false);
  }, [pagination.hasNext, isLoading, isInitialLoad, hasIntersected]);

  useEffect(() => {
    if (isLoading) {
      setHasIntersected(false);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <WebsitePageHeader
          title="Recent Profiles"
          description="Visitor profiles with session data and behavior patterns"
          icon={<UserRound className="h-6 w-6 text-primary" />}
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
                <span className="text-sm">Loading profiles...</span>
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
          title="Recent Profiles"
          description="Visitor profiles with session data and behavior patterns"
          icon={<UserRound className="h-6 w-6 text-primary" />}
          websiteId={websiteId}
          variant="minimal"
          hasError={true}
          errorMessage={error?.message || "Failed to load profiles"}
        />
      </div>
    );
  }

  if (!allProfiles || allProfiles.length === 0) {
    return (
      <div className="space-y-6">
        <WebsitePageHeader
          title="Recent Profiles"
          description="Visitor profiles with session data and behavior patterns"
          icon={<UserRound className="h-6 w-6 text-primary" />}
          websiteId={websiteId}
          variant="minimal"
        />
        <Card>
          <CardContent>
            <div className="py-12 text-center text-muted-foreground">
              <UserRound className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2 font-medium text-lg">No profiles found</p>
              <p className="text-sm">
                Visitor profiles will appear here once users visit your website
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WebsitePageHeader
        title="Recent Profiles"
        description="Visitor profiles with session data and behavior patterns"
        icon={<UserRound className="h-6 w-6 text-primary" />}
        websiteId={websiteId}
        variant="minimal"
        subtitle={`${allProfiles.length} loaded`}
      />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {allProfiles.map((profile: ProfileData, index: number) => (
              <ProfileRow
                index={index}
                isExpanded={expandedProfileId === profile.visitor_id}
                key={`${profile.visitor_id}-${index}`}
                onToggle={() => toggleProfile(profile.visitor_id)}
                profile={profile}
              />
            ))}
          </div>

          <div className="border-t p-4" ref={setLoadMoreRef}>
            {pagination.hasNext ? (
              <div className="flex justify-center">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading more profiles...</span>
                  </div>
                ) : showLoadMore ? (
                  <Button
                    className="w-full"
                    onClick={() => setPage(prev => prev + 1)}
                    variant="outline"
                  >
                    Load More Profiles
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">All profiles loaded</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
