import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { and, eq, isNull, desc, sql, inArray } from 'drizzle-orm';
import { escape as sqlEscape } from 'sqlstring';
import { TRPCError } from '@trpc/server';
import { goals, chQuery } from '@databuddy/db';
import { authorizeWebsiteAccess } from '../utils/auth';
import { logger } from '../utils/discord-webhook';

const goalSchema = z.object({
    type: z.enum(['PAGE_VIEW', 'EVENT', 'CUSTOM']),
    target: z.string().min(1),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'contains', 'not_equals', 'in', 'not_in']),
        value: z.union([z.string(), z.array(z.string())]),
    })).optional(),
});

const createGoalSchema = z.object({
    websiteId: z.string(),
    ...goalSchema.shape,
});

const updateGoalSchema = z.object({
    id: z.string(),
    type: z.enum(['PAGE_VIEW', 'EVENT', 'CUSTOM']).optional(),
    target: z.string().min(1).optional(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'contains', 'not_equals', 'in', 'not_in']),
        value: z.union([z.string(), z.array(z.string())]),
    })).optional(),
    isActive: z.boolean().optional(),
});

const analyticsDateRangeSchema = z.object({
    goalId: z.string(),
    websiteId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const ALLOWED_FIELDS = new Set([
    'id', 'client_id', 'event_name', 'anonymous_id', 'time', 'session_id',
    'event_type', 'event_id', 'session_start_time', 'timestamp',
    'referrer', 'url', 'path', 'title', 'ip', 'user_agent', 'browser_name',
    'browser_version', 'os_name', 'os_version', 'device_type', 'device_brand',
    'device_model', 'country', 'region', 'city', 'screen_resolution',
    'viewport_size', 'language', 'timezone', 'connection_type', 'rtt',
    'downlink', 'time_on_page', 'scroll_depth', 'interaction_count',
    'exit_intent', 'page_count', 'is_bounce', 'has_exit_intent', 'page_size',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'load_time', 'dom_ready_time', 'dom_interactive', 'ttfb', 'connection_time',
    'request_time', 'render_time', 'redirect_time', 'domain_lookup_time',
    'fcp', 'lcp', 'cls', 'fid', 'inp', 'href', 'text', 'value',
    'error_message', 'error_filename', 'error_lineno', 'error_colno',
    'error_stack', 'error_type', 'properties', 'created_at',
]);

const ALLOWED_OPERATORS = new Set([
    'equals', 'contains', 'not_equals', 'in', 'not_in',
]);

// Refactored buildFilterConditions to use parameterized values
const buildFilterConditions = (filters: Array<{ field: string; operator: string; value: string | string[] }>, paramPrefix: string, params: Record<string, unknown>) => {
    if (!filters || filters.length === 0) return '';
    const filterConditions = filters.map((filter, i) => {
        if (!ALLOWED_FIELDS.has(filter.field)) return '';
        if (!ALLOWED_OPERATORS.has(filter.operator)) return '';
        const field = filter.field;
        const value = Array.isArray(filter.value) ? filter.value : [filter.value];
        const key = `${paramPrefix}_${i}`;
        switch (filter.operator) {
            case 'equals':
                params[key] = value[0];
                return `${field} = {${key}:String}`;
            case 'contains':
                params[key] = `%${value[0]}%`;
                return `${field} LIKE {${key}:String}`;
            case 'not_equals':
                params[key] = value[0];
                return `${field} != {${key}:String}`;
            case 'in':
                params[key] = value;
                return `${field} IN {${key}:Array(String)}`;
            case 'not_in':
                params[key] = value;
                return `${field} NOT IN {${key}:Array(String)}`;
            default:
                return '';
        }
    }).filter(Boolean);
    return filterConditions.length > 0 ? ` AND ${filterConditions.join(' AND ')}` : '';
};

const getDefaultDateRange = () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate, endDate };
};

export const goalsRouter = createTRPCRouter({
    // List all goals for a website
    list: protectedProcedure
        .input(z.object({ websiteId: z.string() }))
        .query(async ({ ctx, input }) => {
            await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
            const result = await ctx.db
                .select()
                .from(goals)
                .where(and(
                    eq(goals.websiteId, input.websiteId),
                    isNull(goals.deletedAt)
                ))
                .orderBy(desc(goals.createdAt));
            return result;
        }),
    // Get a specific goal
    getById: protectedProcedure
        .input(z.object({ id: z.string(), websiteId: z.string() }))
        .query(async ({ ctx, input }) => {
            await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
            const result = await ctx.db
                .select()
                .from(goals)
                .where(and(
                    eq(goals.id, input.id),
                    eq(goals.websiteId, input.websiteId),
                    isNull(goals.deletedAt)
                ))
                .limit(1);
            if (result.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
            }
            return result[0];
        }),
    // Create a new goal
    create: protectedProcedure
        .input(createGoalSchema)
        .mutation(async ({ ctx, input }) => {
            await authorizeWebsiteAccess(ctx, input.websiteId, 'update');
            const goalId = crypto.randomUUID();
            const [newGoal] = await ctx.db
                .insert(goals)
                .values({
                    id: goalId,
                    websiteId: input.websiteId,
                    type: input.type,
                    target: input.target,
                    name: input.name,
                    description: input.description,
                    filters: input.filters,
                    isActive: true,
                    createdBy: ctx.user.id,
                } as any)
                .returning();

            return newGoal;
        }),
    // Update a goal
    update: protectedProcedure
        .input(updateGoalSchema)
        .mutation(async ({ ctx, input }) => {
            const existingGoal = await ctx.db
                .select({ websiteId: goals.websiteId })
                .from(goals)
                .where(and(
                    eq(goals.id, input.id),
                    isNull(goals.deletedAt)
                ))
                .limit(1);
            if (existingGoal.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
            }
            await authorizeWebsiteAccess(ctx, existingGoal[0].websiteId, 'update');
            const { id, ...updates } = input;
            const [updatedGoal] = await ctx.db
                .update(goals)
                .set({
                    ...updates,
                    updatedAt: new Date().toISOString(),
                } as any)
                .where(and(
                    eq(goals.id, id),
                    isNull(goals.deletedAt)
                ))
                .returning();
            return updatedGoal;
        }),
    // Delete a goal (soft delete)
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const existingGoal = await ctx.db
                .select({ websiteId: goals.websiteId })
                .from(goals)
                .where(and(
                    eq(goals.id, input.id),
                    isNull(goals.deletedAt)
                ))
                .limit(1);
            if (existingGoal.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
            }
            await authorizeWebsiteAccess(ctx, existingGoal[0].websiteId, 'delete');
            await ctx.db
                .update(goals)
                .set({
                    deletedAt: new Date().toISOString(),
                    isActive: false,
                } as any)
                .where(and(
                    eq(goals.id, input.id),
                    isNull(goals.deletedAt)
                ));
            return { success: true };
        }),
    // Get goal analytics (conversion rate)
    getAnalytics: protectedProcedure
        .input(analyticsDateRangeSchema)
        .query(async ({ ctx, input }) => {
            await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
            const { startDate, endDate } = input.startDate && input.endDate
                ? { startDate: input.startDate, endDate: input.endDate }
                : getDefaultDateRange();
            const goal = await ctx.db
                .select()
                .from(goals)
                .where(and(
                    eq(goals.id, input.goalId),
                    eq(goals.websiteId, input.websiteId),
                    isNull(goals.deletedAt)
                ))
                .limit(1);
            if (goal.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
            }
            const goalData = goal[0];
            const steps = [{
                type: goalData.type,
                target: goalData.target,
                name: goalData.name,
            }];
            const filters = goalData.filters as Array<{ field: string; operator: string; value: string | string[] }> || [];
            const filterConditions = buildFilterConditions(filters, 'f', {});

            // Build the step query (copied from funnels.ts, but only one step)
            let whereCondition = '';
            if (steps[0].type === 'PAGE_VIEW') {
                const targetPath = steps[0].target.replace(/'/g, "''");
                whereCondition = `event_name = 'screen_view' AND (path = '${targetPath}' OR path LIKE '%${targetPath}%')`;
            } else if (steps[0].type === 'EVENT') {
                const eventName = steps[0].target.replace(/'/g, "''");
                whereCondition = `event_name = '${eventName}'`;
            }
            const stepQuery = `
                SELECT 
                    1 as step_number,
                    '${steps[0].name.replace(/'/g, "''")}' as step_name,
                    session_id,
                    MIN(time) as first_occurrence
                FROM analytics.events
                WHERE client_id = '${input.websiteId}'
                    AND time >= parseDateTimeBestEffort('${startDate}')
                    AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
                    AND ${whereCondition}${filterConditions}
                GROUP BY session_id`;
            const analysisQuery = `
                WITH all_step_events AS (
                    ${stepQuery}
                )
                SELECT 
                    step_number,
                    step_name,
                    session_id,
                    first_occurrence
                FROM all_step_events
                ORDER BY session_id, first_occurrence
            `;
            const rawResults = await chQuery<{
                step_number: number;
                step_name: string;
                session_id: string;
                first_occurrence: number;
            }>(analysisQuery);

            // Process the results to calculate analytics
            const sessionEvents = new Map<string, Array<{ step_number: number, step_name: string, first_occurrence: number }>>();
            for (const event of rawResults) {
                if (!sessionEvents.has(event.session_id)) {
                    sessionEvents.set(event.session_id, []);
                }
                sessionEvents.get(event.session_id)?.push({
                    step_number: event.step_number,
                    step_name: event.step_name,
                    first_occurrence: event.first_occurrence
                });
            }
            // Calculate analytics
            const stepCounts = new Map<number, Set<string>>();
            for (const [sessionId, events] of sessionEvents) {
                events.sort((a, b) => a.first_occurrence - b.first_occurrence);
                let currentStep = 1;
                for (const event of events) {
                    if (event.step_number === currentStep) {
                        if (!stepCounts.has(event.step_number)) {
                            stepCounts.set(event.step_number, new Set());
                        }
                        stepCounts.get(event.step_number)?.add(sessionId);
                        currentStep++;
                    }
                }
            }
            // Build analytics results
            const users = stepCounts.get(1)?.size || 0;
            const total_users = users;
            const conversion_rate = 100.0;
            const dropoffs = 0;
            const dropoff_rate = 0;
            const analyticsResults = [{
                step_number: 1,
                step_name: steps[0].name,
                users,
                total_users,
                conversion_rate,
                dropoffs,
                dropoff_rate,
                avg_time_to_complete: 0
            }];
            return {
                overall_conversion_rate: users > 0 ? 100.0 : 0,
                total_users_entered: total_users,
                total_users_completed: users,
                avg_completion_time: 0,
                avg_completion_time_formatted: '0s',
                steps_analytics: analyticsResults
            };
        }),
    // Bulk analytics for multiple goals
    bulkAnalytics: protectedProcedure
        .input(z.object({
            websiteId: z.string(),
            goalIds: z.array(z.string()),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }))
        .query(async ({ ctx, input }) => {
            await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
            const { startDate, endDate } = input.startDate && input.endDate
                ? { startDate: input.startDate, endDate: input.endDate }
                : getDefaultDateRange();
            const goalsList = await ctx.db
                .select()
                .from(goals)
                .where(and(
                    eq(goals.websiteId, input.websiteId),
                    isNull(goals.deletedAt),
                    input.goalIds.length > 0 ? inArray(goals.id, input.goalIds) : sql`1=0`
                ))
                .orderBy(desc(goals.createdAt));
            const analyticsResults: Record<string, any> = {};
            for (const goalData of goalsList) {
                const steps = [{
                    type: goalData.type,
                    target: goalData.target,
                    name: goalData.name,
                }];
                const filters = goalData.filters as Array<{ field: string; operator: string; value: string | string[] }> || [];
                const filterConditions = buildFilterConditions(filters, 'f', {});
                let whereCondition = '';
                if (steps[0].type === 'PAGE_VIEW') {
                    const targetPath = steps[0].target.replace(/'/g, "''");
                    whereCondition = `event_name = 'screen_view' AND (path = '${targetPath}' OR path LIKE '%${targetPath}%')`;
                } else if (steps[0].type === 'EVENT') {
                    const eventName = steps[0].target.replace(/'/g, "''");
                    whereCondition = `event_name = '${eventName}'`;
                }
                const stepQuery = `
                    SELECT 
                        1 as step_number,
                        '${steps[0].name.replace(/'/g, "''")}' as step_name,
                        session_id,
                        MIN(time) as first_occurrence
                    FROM analytics.events
                    WHERE client_id = '${input.websiteId}'
                        AND time >= parseDateTimeBestEffort('${startDate}')
                        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
                        AND ${whereCondition}${filterConditions}
                    GROUP BY session_id`;
                const analysisQuery = `
                    WITH all_step_events AS (
                        ${stepQuery}
                    )
                    SELECT 
                        step_number,
                        step_name,
                        session_id,
                        first_occurrence
                    FROM all_step_events
                    ORDER BY session_id, first_occurrence
                `;
                const rawResults = await chQuery<{
                    step_number: number;
                    step_name: string;
                    session_id: string;
                    first_occurrence: number;
                }>(analysisQuery);
                const sessionEvents = new Map<string, Array<{ step_number: number, step_name: string, first_occurrence: number }>>();
                for (const event of rawResults) {
                    if (!sessionEvents.has(event.session_id)) {
                        sessionEvents.set(event.session_id, []);
                    }
                    sessionEvents.get(event.session_id)?.push({
                        step_number: event.step_number,
                        step_name: event.step_name,
                        first_occurrence: event.first_occurrence
                    });
                }
                const stepCounts = new Map<number, Set<string>>();
                for (const [sessionId, events] of sessionEvents) {
                    events.sort((a, b) => a.first_occurrence - b.first_occurrence);
                    let currentStep = 1;
                    for (const event of events) {
                        if (event.step_number === currentStep) {
                            if (!stepCounts.has(event.step_number)) {
                                stepCounts.set(event.step_number, new Set());
                            }
                            stepCounts.get(event.step_number)?.add(sessionId);
                            currentStep++;
                        }
                    }
                }
                const users = stepCounts.get(1)?.size || 0;
                const total_users = users;
                const conversion_rate = 100.0;
                const dropoffs = 0;
                const dropoff_rate = 0;
                const analyticsStep = {
                    step_number: 1,
                    step_name: steps[0].name,
                    users,
                    total_users,
                    conversion_rate,
                    dropoffs,
                    dropoff_rate,
                    avg_time_to_complete: 0
                };
                analyticsResults[goalData.id] = {
                    overall_conversion_rate: users > 0 ? 100.0 : 0,
                    total_users_entered: total_users,
                    total_users_completed: users,
                    avg_completion_time: 0,
                    avg_completion_time_formatted: '0s',
                    steps_analytics: [analyticsStep]
                };
            }
            return analyticsResults;
        }),
}); 