"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, Loader2Icon } from "lucide-react";
import { useInfiniteAnalyticsProfiles } from "@/hooks/use-analytics";
import { ProfileRow } from "./profile-row";
import { getDefaultDateRange } from "./profile-utils";

interface ProfilesListProps {
    websiteId: string;
}

export function ProfilesList({ websiteId }: ProfilesListProps) {
    const [dateRange] = useState(() => getDefaultDateRange());
    const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteAnalyticsProfiles(websiteId, dateRange, 25);

    const toggleProfile = (profileId: string) => {
        setExpandedProfileId(expandedProfileId === profileId ? null : profileId);
    };

    // Intersection Observer for infinite scrolling
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
            rootMargin: '200px', // Increased for better UX
        });

        observer.observe(loadMoreRef);

        return () => {
            observer.disconnect();
        };
    }, [loadMoreRef, handleIntersection]);

    // Flatten all profiles from all pages (memoized for performance)
    const allProfiles = useMemo(() => {
        return data?.pages.flatMap(page => page.profiles) || [];
    }, [data?.pages]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold tracking-tight">Recent Profiles</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Visitor profiles with session data and behavior patterns
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-16 bg-muted/20 animate-pulse rounded" />
                        ))}
                    </div>
                    <div className="flex items-center justify-center pt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading profiles...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold tracking-tight text-destructive">
                        Error Loading Profiles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {error?.message || 'Failed to load profiles'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!allProfiles || allProfiles.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold tracking-tight">Recent Profiles</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Visitor profiles with session data and behavior patterns
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <UserRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No profiles found</p>
                        <p className="text-sm">Visitor profiles will appear here once users visit your website</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">
                    Recent Profiles ({allProfiles.length} loaded)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Visitor profiles with session data and behavior patterns
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {allProfiles.map((profile, index) => (
                        <ProfileRow
                            key={profile.visitor_id || index}
                            profile={profile}
                            index={index}
                            isExpanded={expandedProfileId === profile.visitor_id}
                            onToggle={() => toggleProfile(profile.visitor_id)}
                        />
                    ))}
                </div>

                {/* Load More Trigger */}
                <div className="p-4 border-t border-border">
                    {hasNextPage ? (
                        <div ref={setLoadMoreRef} className="flex justify-center">
                            {isFetchingNextPage ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Loading more profiles...</span>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => fetchNextPage()}
                                    className="w-full"
                                >
                                    Load More Profiles
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground">
                            All profiles loaded
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 