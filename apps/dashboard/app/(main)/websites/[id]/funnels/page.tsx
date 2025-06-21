"use client";

import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useWebsite } from "@/hooks/use-websites";
import { useAtom } from "jotai";
import {
    dateRangeAtom,
    timeGranularityAtom,
    formattedDateRangeAtom,
} from "@/stores/jotai/filterAtoms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendDownIcon, ChartBarIcon } from "@phosphor-icons/react";
import {
    useFunnels,
    useFunnelAnalytics,
    useFunnelAnalyticsByReferrer,
    useAutocompleteData,
    type Funnel,
    type CreateFunnelData,
} from "@/hooks/use-funnels";

const PageHeader = lazy(() => import("./_components/page-header").then(m => ({ default: m.PageHeader })));
const FunnelsList = lazy(() => import("./_components/funnels-list").then(m => ({ default: m.FunnelsList })));
const FunnelAnalytics = lazy(() => import("./_components/funnel-analytics").then(m => ({ default: m.FunnelAnalytics })));
const FunnelAnalyticsByReferrer = lazy(() => import("./_components/funnel-analytics-by-referrer"));
const EditFunnelDialog = lazy(() => import("./_components/edit-funnel-dialog").then(m => ({ default: m.EditFunnelDialog })));
const DeleteFunnelDialog = lazy(() => import("./_components/delete-funnel-dialog").then(m => ({ default: m.DeleteFunnelDialog })));

const PageHeaderSkeleton = () => (
    <div className="space-y-6">
        <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted animate-pulse rounded-xl"></div>
                        <div>
                            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
                            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-lg"></div>
                    <div className="h-10 w-36 bg-muted animate-pulse rounded-lg"></div>
                </div>
            </div>
        </div>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            </div>
        </div>
    </div>
);

const FunnelsListSkeleton = () => (
    <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-6 bg-muted rounded-lg w-48"></div>
                                <div className="h-4 w-4 bg-muted rounded"></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 bg-muted rounded-full w-16"></div>
                                <div className="h-4 bg-muted rounded w-20"></div>
                            </div>
                        </div>
                        <div className="h-8 w-8 bg-muted rounded"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="h-3 bg-muted rounded w-24 mb-2"></div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-muted rounded-lg w-32"></div>
                                <div className="h-4 w-4 bg-muted rounded"></div>
                                <div className="h-8 bg-muted rounded-lg w-28"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        ))}
    </div>
);

export default function FunnelsPage() {
    const { id } = useParams();
    const websiteId = id as string;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedFunnelId, setExpandedFunnelId] = useState<string | null>(null);
    const [selectedReferrer, setSelectedReferrer] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
    const [deletingFunnelId, setDeletingFunnelId] = useState<string | null>(null);


    // Intersection observer for lazy loading
    const [isVisible, setIsVisible] = useState(false);
    const pageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (pageRef.current) {
            observer.observe(pageRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const [,] = useAtom(dateRangeAtom);
    const [currentGranularity] = useAtom(timeGranularityAtom);
    const [formattedDateRangeState] = useAtom(formattedDateRangeAtom);

    const memoizedDateRangeForTabs = useMemo(() => ({
        start_date: formattedDateRangeState.startDate,
        end_date: formattedDateRangeState.endDate,
        granularity: currentGranularity,
    }), [formattedDateRangeState, currentGranularity]);

    const { data: websiteData } = useWebsite(websiteId);

    const {
        data: funnels,
        isLoading: funnelsLoading,
        error: funnelsError,
        refetch: refetchFunnels,
        createFunnel,
        updateFunnel,
        deleteFunnel,
        isCreating,
        isUpdating,
    } = useFunnels(websiteId);

    const {
        data: analyticsData,
        isLoading: analyticsLoading,
        error: analyticsError,
        refetch: refetchAnalytics
    } = useFunnelAnalytics(
        websiteId,
        expandedFunnelId || '',
        memoizedDateRangeForTabs,
        { enabled: !!expandedFunnelId }
    );

    const {
        data: referrerAnalyticsData,
        isLoading: referrerAnalyticsLoading,
        error: referrerAnalyticsError,
        refetch: refetchReferrerAnalytics
    } = useFunnelAnalyticsByReferrer(
        websiteId,
        expandedFunnelId || '',
        {
            start_date: formattedDateRangeState.startDate,
            end_date: formattedDateRangeState.endDate
        },
        { enabled: !!expandedFunnelId }
    );

    // Preload autocomplete data for instant suggestions in dialogs
    const autocompleteQuery = useAutocompleteData(websiteId);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const promises: Promise<any>[] = [refetchFunnels(), autocompleteQuery.refetch()];
            if (expandedFunnelId) {
                promises.push(refetchAnalytics(), refetchReferrerAnalytics());
            }
            await Promise.all(promises);
        } catch (error) {
            console.error("Failed to refresh funnel data:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchFunnels, refetchAnalytics, refetchReferrerAnalytics, autocompleteQuery.refetch, expandedFunnelId]);

    const handleCreateFunnel = async (data: CreateFunnelData) => {
        try {
            await createFunnel(data);
            setIsDialogOpen(false);
            setEditingFunnel(null);
        } catch (error) {
            console.error("Failed to create funnel:", error);
        }
    };

    const handleUpdateFunnel = async (funnel: Funnel) => {
        try {
            await updateFunnel({
                funnelId: funnel.id,
                updates: {
                    name: funnel.name,
                    description: funnel.description,
                    steps: funnel.steps,
                    filters: funnel.filters
                }
            });
            setIsDialogOpen(false);
            setEditingFunnel(null);
        } catch (error) {
            console.error("Failed to update funnel:", error);
        }
    };

    const handleDeleteFunnel = async (funnelId: string) => {
        try {
            await deleteFunnel(funnelId);
            if (expandedFunnelId === funnelId) {
                setExpandedFunnelId(null);
            }
            setDeletingFunnelId(null);
        } catch (error) {
            console.error("Failed to delete funnel:", error);
        }
    };

    const handleToggleFunnel = (funnelId: string) => {
        setExpandedFunnelId(expandedFunnelId === funnelId ? null : funnelId);
        setSelectedReferrer("all");
    };

    const handleReferrerChange = (referrer: string) => {
        setSelectedReferrer(referrer);
    };

    const formatCompletionTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    if (funnelsError) {
        return (
            <div className="p-6 max-w-[1600px] mx-auto">
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <TrendDownIcon size={16} weight="duotone" className="h-5 w-5 text-red-600" />
                            <p className="text-red-600 font-medium">Error loading funnel data</p>
                        </div>
                        <p className="text-red-600/80 text-sm mt-2">{funnelsError.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div ref={pageRef} className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
            <Suspense fallback={<PageHeaderSkeleton />}>
                <PageHeader
                    websiteName={websiteData?.name || ''}
                    funnelsCount={funnels.length}
                    isRefreshing={isRefreshing}
                    isLoading={funnelsLoading}
                    hasError={!!funnelsError}
                    onRefresh={handleRefresh}
                    onCreateFunnel={() => {
                        setEditingFunnel(null);
                        setIsDialogOpen(true);
                    }}
                />
            </Suspense>

            <Suspense fallback={<FunnelsListSkeleton />}>
                <FunnelsList
                    funnels={funnels}
                    isLoading={funnelsLoading}
                    expandedFunnelId={expandedFunnelId}
                    onToggleFunnel={handleToggleFunnel}
                    onEditFunnel={(funnel) => {
                        setEditingFunnel(funnel);
                        setIsDialogOpen(true);
                    }}
                    onDeleteFunnel={setDeletingFunnelId}
                    onCreateFunnel={() => {
                        setEditingFunnel(null);
                        setIsDialogOpen(true);
                    }}
                >
                    {(funnel) => {
                        if (expandedFunnelId !== funnel.id) return null;

                        const currentAnalyticsData = useMemo(() => {
                            if (selectedReferrer === "all") return analyticsData;

                            const referrerData = referrerAnalyticsData?.data?.referrer_analytics
                                ?.find(r => r.referrer === selectedReferrer);

                            if (!referrerData) return null;

                            return {
                                success: true,
                                data: {
                                    overall_conversion_rate: referrerData.overall_conversion_rate,
                                    total_users_entered: referrerData.total_users,
                                    total_users_completed: referrerData.completed_users,
                                    avg_completion_time: 0,
                                    avg_completion_time_formatted: '0s',
                                    biggest_dropoff_step: 1,
                                    biggest_dropoff_rate: 0,
                                    steps_analytics: referrerData.steps_analytics
                                }
                            };
                        }, [selectedReferrer, analyticsData, referrerAnalyticsData]);

                        const summaryStats = useMemo(() => {
                            const steps = currentAnalyticsData?.data?.steps_analytics;
                            if (!steps) return { totalUsers: 0, overallConversion: 0, avgCompletionTime: 0, biggestDropoffRate: 0 };

                            const totalUsers = steps[0]?.users || 0;
                            const finalUsers = steps[steps.length - 1]?.users || 0;
                            const overallConversion = totalUsers > 0 ? (finalUsers / totalUsers) * 100 : 0;
                            const avgCompletionTime = steps.reduce((sum, step) => sum + ((step as any).avg_time_to_complete || 0), 0) / steps.length;
                            const biggestDropoffRate = Math.max(...steps.map(step => step.dropoff_rate || 0));

                            return { totalUsers, overallConversion, avgCompletionTime, biggestDropoffRate };
                        }, [currentAnalyticsData]);

                        return (
                            <Suspense fallback={
                                <div className="flex items-center justify-center py-8">
                                    <div className="relative">
                                        <div className="w-6 h-6 rounded-full border-2 border-muted"></div>
                                        <div className="absolute top-0 left-0 w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                    </div>
                                    <div className="ml-3 text-sm text-muted-foreground">
                                        Loading analytics...
                                    </div>
                                </div>
                            }>
                                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <FunnelAnalytics
                                        isLoading={selectedReferrer === "all" ? analyticsLoading : referrerAnalyticsLoading}
                                        error={selectedReferrer === "all" ? analyticsError : referrerAnalyticsError}
                                        data={currentAnalyticsData}
                                        summaryStats={summaryStats}
                                        onRetry={selectedReferrer === "all" ? refetchAnalytics : refetchReferrerAnalytics}
                                        formatCompletionTime={formatCompletionTime}
                                    />

                                    <div className="border-t border-border/50 pt-4">
                                        <FunnelAnalyticsByReferrer
                                            websiteId={websiteId}
                                            funnelId={funnel.id}
                                            dateRange={{
                                                start_date: formattedDateRangeState.startDate,
                                                end_date: formattedDateRangeState.endDate
                                            }}
                                            onReferrerChange={handleReferrerChange}
                                        />
                                    </div>
                                </div>
                            </Suspense>
                        );
                    }}
                </FunnelsList>
            </Suspense>

            {isDialogOpen && (
                <Suspense fallback={null}>
                    <EditFunnelDialog
                        isOpen={isDialogOpen}
                        onClose={() => {
                            setIsDialogOpen(false);
                            setEditingFunnel(null);
                        }}
                        onSubmit={handleUpdateFunnel}
                        onCreate={handleCreateFunnel}
                        funnel={editingFunnel}
                        isUpdating={isUpdating}
                        isCreating={isCreating}
                        autocompleteData={autocompleteQuery.data}
                    />
                </Suspense>
            )}

            {!!deletingFunnelId && (
                <Suspense fallback={null}>
                    <DeleteFunnelDialog
                        isOpen={!!deletingFunnelId}
                        onClose={() => setDeletingFunnelId(null)}
                        onConfirm={() => deletingFunnelId && handleDeleteFunnel(deletingFunnelId)}
                    />
                </Suspense>
            )}
        </div>
    );
} 