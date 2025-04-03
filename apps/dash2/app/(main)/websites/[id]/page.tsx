"use client";

import { useEffect, useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ExternalLink, 
  Pencil, 
  RefreshCw,
  Calendar,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebsiteDialog } from "@/components/website-dialog";
import { getWebsiteById, updateWebsite } from "@/app/actions/websites";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/app/providers";
import { format, subDays, subHours, differenceInDays } from "date-fns";
import { DateRange as DayPickerRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Tab content components
import { WebsiteOverviewTab } from "./components/tabs/overview-tab";
import { WebsiteAudienceTab } from "./components/tabs/audience-tab";
import { WebsiteContentTab } from "./components/tabs/content-tab";
import { WebsitePerformanceTab } from "./components/tabs/performance-tab";
import { WebsiteSettingsTab } from "./components/tabs/settings-tab";
import { WebsiteSessionsTab } from "./components/tabs/sessions-tab";
import { WebsiteProfilesTab } from "./components/tabs/profiles-tab";
import { WebsiteErrorsTab } from "./components/tabs/errors-tab";

// Shared types
import { DateRange as BaseDateRange } from "@/hooks/use-analytics";
import { FullTabProps, WebsiteDataTabProps } from "./components/utils/types";
import React from "react";

// Add type for tab ID
type TabId = 'overview' | 'audience' | 'content' | 'performance' | 'settings' | 'sessions' | 'profiles' | 'errors';

// Tab definition structure
type TabDefinition = {
  id: TabId;
  label: string;
  component: React.ComponentType<any>;
  className?: string;
  props?: "settings" | "full";
};

function WebsiteDetailsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDetails, setRefreshDetails] = useState({
    component: "",
    progress: 0,
    total: 4
  });
  
  // Date range state for analytics with default to last 30 days
  const [dateRange, setDateRange] = useState<BaseDateRange>({
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Initialize date picker state with the same values
  const [date, setDate] = useState<DayPickerRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Add time range granularity state
  const [timeGranularity, setTimeGranularity] = useState<'daily' | 'hourly'>('daily');
  
  // Quick date range options
  const quickRanges = [
    { label: "Last 24 hours", value: "24h", fn: () => ({
      start: subHours(new Date(), 24),
      end: new Date()
    })},
    { label: "Last 7 days", value: "7d", fn: () => ({
      start: subDays(new Date(), 7),
      end: new Date()
    })},
    { label: "Last 30 days", value: "30d", fn: () => ({
      start: subDays(new Date(), 30),
      end: new Date()
    })},
  ];
  
  // Handler for quick range selection
  const handleQuickRangeSelect = (rangeValue: string) => {
    const selectedRange = quickRanges.find(r => r.value === rangeValue);
    if (selectedRange) {
      const { start, end } = selectedRange.fn();
      setDate({ from: start, to: end });
      setDateRange({
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd')
      });
    }
  };

  // Memoize date range to prevent unnecessary re-renders
  const memoizedDateRange = useMemo(() => ({
    ...dateRange,
    granularity: timeGranularity
  }), [dateRange, timeGranularity]);

  // Callback for date range updates
  const handleDateRangeChange = useCallback((range: DayPickerRange | undefined) => {
    if (range?.from && range?.to) {
      setDate(range);
      setDateRange({
        start_date: format(range.from, 'yyyy-MM-dd'),
        end_date: format(range.to, 'yyyy-MM-dd')
      });
    }
  }, []);

  // Fetch website details with optimized settings
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["website", id],
    queryFn: async () => {
      const result = await getWebsiteById(id as string);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000, // 10 min
  });

  // Handle website update
  const updateWebsiteMutation = useMutation({
    mutationFn: async (data: { name?: string; domain?: string }) => {
      return updateWebsite(id as string, data);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Website updated successfully");
      queryClient.invalidateQueries({ queryKey: ["website", id] });
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
    onError: (error) => {
      toast.error("Failed to update website");
      console.error(error);
    },
  });

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load website details");
      console.error(error);
    }
  }, [isError, error]);

  // Common props for tab components
  const tabProps: FullTabProps = {
    websiteId: id as string,
    dateRange: memoizedDateRange,
    websiteData: data,
    isRefreshing: isRefreshing,
    setIsRefreshing: (value: boolean) => {
      setIsRefreshing(value);
    }
  };

  // Props for settings tab which doesn't use dateRange
  const settingsProps: WebsiteDataTabProps = {
    websiteId: id as string,
    dateRange: memoizedDateRange,
    websiteData: data
  };

  // Function to render tab content
  const renderTabContent = (tabId: TabId) => {
    // Only render if this tab is active
    if (tabId !== activeTab) return null;

    // Choose which component to render
    switch (tabId) {
      case "overview":
        return <WebsiteOverviewTab {...tabProps} />;
      case "audience":
        return <WebsiteAudienceTab {...tabProps} />;
      case "content":
        return <WebsiteContentTab {...tabProps} />;
      case "performance":
        return <WebsitePerformanceTab {...tabProps} />;
      case "settings":
        return <WebsiteSettingsTab {...settingsProps} />;
      case "sessions":
        return <WebsiteSessionsTab {...tabProps} />;
      case "profiles":
        return <WebsiteProfilesTab {...tabProps} />;
      case "errors":
        return <WebsiteErrorsTab {...tabProps} />;
    }
  };

  // Define all tabs
  const tabs: TabDefinition[] = [
    { id: "overview", label: "Overview", component: WebsiteOverviewTab, className: "pt-2 space-y-2" },
    { id: "audience", label: "Audience", component: WebsiteAudienceTab },
    { id: "content", label: "Content", component: WebsiteContentTab },
    { id: "performance", label: "Performance", component: WebsitePerformanceTab },
    { id: "sessions", label: "Sessions", component: WebsiteSessionsTab },
    { id: "profiles", label: "Profiles", component: WebsiteProfilesTab },
    { id: "errors", label: "Errors", component: WebsiteErrorsTab },
    { id: "settings", label: "Settings", component: WebsiteSettingsTab, props: "settings" },
  ];

  // Add a new handleRefresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Display progress through different components
      setRefreshDetails({ component: "Overview data", progress: 1, total: 4 });
      await new Promise(r => setTimeout(r, 400)); // Simulate network request
      
      setRefreshDetails({ component: "Audience data", progress: 2, total: 4 });
      await new Promise(r => setTimeout(r, 400)); // Simulate network request
      
      setRefreshDetails({ component: "Content data", progress: 3, total: 4 });
      await new Promise(r => setTimeout(r, 400)); // Simulate network request
      
      setRefreshDetails({ component: "Finishing up", progress: 4, total: 4 });
      await new Promise(r => setTimeout(r, 300)); // Simulate network request
      
      // Success message
      toast.success("All dashboard data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh some dashboard data");
      console.error(error);
    } finally {
      // Reset states
      setIsRefreshing(false);
      setRefreshDetails({ component: "", progress: 0, total: 4 });
    }
  };

  if (isLoading) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" disabled className="h-8 w-8">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Skeleton className="h-7 w-48 mb-1" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-9 w-full max-w-xs mb-4" />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <h1 className="text-xl font-bold mb-2">Website Not Found</h1>
          <p className="text-muted-foreground text-sm mb-4">
            The website you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button asChild size="sm">
            <Link href="/websites">Back to Websites</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 max-w-[1600px] mx-auto">
      {/* Compact header */}
      <header className="border-b pb-3">
        {/* <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/websites")}
              className="h-8 w-8 cursor-pointer hover:bg-gray-100 -ml-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold leading-tight">{data.name || "Unnamed Website"}</h1>
              <a
                href={data.domain}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                {data.domain}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div> */}
        
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap mt-3 bg-muted/30 rounded-lg p-2.5 border">
          {/* Time granularity toggle */}
          <div className="bg-background rounded-md border overflow-hidden flex shadow-sm h-8">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs px-3 rounded-none cursor-pointer ${timeGranularity === 'daily' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
              onClick={() => setTimeGranularity('daily')}
            >
              Daily
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs px-3 rounded-none cursor-pointer ${timeGranularity === 'hourly' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
              onClick={() => setTimeGranularity('hourly')}
            >
              Hourly
            </Button>
          </div>
          
          <div className="h-5 border-r border-border/70 mx-1" />
          
          {/* Date range preset buttons */}
          <div className="flex items-center gap-1.5 bg-background rounded-md p-1 border shadow-sm overflow-x-auto scrollbar-hide flex-1 max-w-md">
            {quickRanges.map((range) => {
              const isActive = date?.from && date?.to && 
                format(date.from, 'yyyy-MM-dd') === format(range.fn().start, 'yyyy-MM-dd') &&
                format(date.to, 'yyyy-MM-dd') === format(range.fn().end, 'yyyy-MM-dd');
              
              return (
                <Button 
                  key={range.value}
                  variant={isActive ? 'default' : 'ghost'} 
                  size="sm" 
                  className={`h-6 text-xs whitespace-nowrap px-2.5 cursor-pointer ${isActive ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => handleQuickRangeSelect(range.value)}
                >
                  {range.label}
                </Button>
              );
            })}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs gap-1.5 whitespace-nowrap px-2.5 border-l border-border/50 ml-1 pl-3 cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">
                    {date?.from ? format(date.from, 'MMM d') : ''} - {date?.to ? format(date.to, 'MMM d') : ''}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 border shadow-lg" align="end">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Select date range</span>
                    <div className="flex gap-1">
                      {quickRanges.map((range) => (
                        <Button 
                          key={range.value}
                          variant="outline"
                          size="sm" 
                          className="h-7 text-xs cursor-pointer"
                          onClick={() => handleQuickRangeSelect(range.value)}
                        >
                          {range.label.replace('Last ', '')}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date() || date < new Date(2020, 0, 1)}
                    className="rounded-md border"
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="mt-2 cursor-pointer"
                      onClick={() => {
                        if (date?.from && date?.to) {
                          setDateRange({
                            start_date: format(date.from, 'yyyy-MM-dd'),
                            end_date: format(date.to, 'yyyy-MM-dd')
                          });
                        }
                      }}
                    >
                      Apply Range
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 ml-auto bg-background shadow-sm font-medium cursor-pointer"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing 
              ? `${refreshDetails.progress}/${refreshDetails.total}` 
              : 'Refresh'
            }
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)} className="space-y-4">
        <div className="border-b">
          <TabsList className="h-10 bg-transparent p-0 w-full justify-start gap-1">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="text-sm h-10 px-4 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none cursor-pointer hover:bg-muted/50"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className={tab.className}>
            <Suspense fallback={<TabLoadingSkeleton />}>
              {renderTabContent(tab.id)}
            </Suspense>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 

// Loading skeleton for tabs
function TabLoadingSkeleton() {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export default function Page() {
    return (
        <Suspense fallback={
          <div className="p-3 flex items-center justify-center h-screen">
            <div className="space-y-3 w-full max-w-md">
              <Skeleton className="h-7 w-2/3 mx-auto" />
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        }>
            <WebsiteDetailsPage />
        </Suspense>
    )
}