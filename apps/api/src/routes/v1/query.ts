import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { authMiddleware } from '../../middleware/auth'
import { websiteAuthHook } from '../../middleware/website'
import { timezoneMiddleware } from '../../middleware/timezone'
import { logger } from '../../lib/logger'
import { chQuery } from '@databuddy/db'
import { getLanguageName } from '@databuddy/shared'

// Single query schema
const singleQuerySchema = z.object({
  id: z.string().optional(), // Optional ID to identify the query in the batch
  startDate: z.string(),
  endDate: z.string(),
  timeZone: z.string().default('UTC'),
  parameters: z.array(z.string()).min(1),
  limit: z.number().min(1).max(1000).default(100),
  page: z.number().min(1).default(1),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'starts_with']),
    value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
  })).default([])
})

// Batch query schema - supports both single query and array of queries
const batchQuerySchema = z.union([
  singleQuerySchema, // Single query (backward compatibility)
  z.array(singleQuerySchema).min(1).max(10) // Array of queries (max 10 for performance)
])

interface Website {
  id: string;
  domain: string;
}

type AnalyticsContext = {
  Variables: {
    website: Website;
    user: any;
  };
};

export const queryRouter = new Hono<AnalyticsContext>()

queryRouter.use('*', authMiddleware)
queryRouter.use('*', websiteAuthHook)
queryRouter.use('*', timezoneMiddleware)

// Dynamic parameter registry - easily extensible
const PARAMETER_BUILDERS = {
  // Device & Browser
  device_type: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      device_type as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND device_type != ''
    GROUP BY device_type
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  browser_name: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      browser_name as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND browser_name != ''
    GROUP BY browser_name
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  os_name: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      os_name as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND os_name != ''
    GROUP BY os_name
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Geography
  country: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      country as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND country != ''
    GROUP BY country
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  region: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      CONCAT(region, ', ', country) as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND region != ''
    GROUP BY region, country
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,
  
  timezone: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      timezone as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND timezone != ''
    GROUP BY timezone
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  language: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      language as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND language != ''
    GROUP BY language
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Pages
  top_pages: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      path as name,
      COUNT(*) as pageviews,
      COUNT(DISTINCT anonymous_id) as visitors
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND path != ''
    GROUP BY path
    ORDER BY pageviews DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  exit_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      path as name,
      COUNT(*) as exits,
      COUNT(DISTINCT session_id) as sessions
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND exit_intent = 1
      AND path != ''
    GROUP BY path
    ORDER BY exits DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // UTM
  utm_source: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      utm_source as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND utm_source != ''
    GROUP BY utm_source
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  utm_medium: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      utm_medium as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND utm_medium != ''
    GROUP BY utm_medium
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  utm_campaign: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      utm_campaign as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND utm_campaign != ''
    GROUP BY utm_campaign
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Referrers
  referrer: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      referrer as name,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND event_name = 'screen_view'
      AND referrer != ''
    GROUP BY referrer
    ORDER BY visitors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  // Performance
  slow_pages: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number) => `
    SELECT 
      path as name,
      AVG(load_time) as avg_load_time,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE client_id = '${websiteId}'
      AND time >= '${startDate}'
      AND time <= '${endDate}'
      AND load_time > 0
      AND path != ''
    GROUP BY path
    ORDER BY avg_load_time DESC
    LIMIT ${limit} OFFSET ${offset}
  `
}

// Helper function to process a single query
async function processSingleQuery(
  query: z.infer<typeof singleQuerySchema>, 
  websiteId: string
) {
  const { startDate, endDate, parameters, limit, page, filters } = query
  const offset = (page - 1) * limit

  // Check if all parameters are supported
  const unsupportedParams = parameters.filter((param: string) => 
    !PARAMETER_BUILDERS[param as keyof typeof PARAMETER_BUILDERS]
  )
  
  if (unsupportedParams.length > 0) {
    return {
      success: false,
      error: `Parameters not supported: ${unsupportedParams.join(', ')}`,
      available_parameters: Object.keys(PARAMETER_BUILDERS),
      queryId: query.id
    }
  }

  // Execute all parameters in parallel
  const results = await Promise.all(
    parameters.map(async (parameter: string) => {
      const builder = PARAMETER_BUILDERS[parameter as keyof typeof PARAMETER_BUILDERS]
      let sql = builder(websiteId, startDate, endDate, limit, offset)
      
      // Apply filters if provided
      if (filters.length > 0) {
        const filterClauses = filters.map((filter: any) => {
          switch (filter.operator) {
            case 'eq': return `${filter.field} = '${filter.value}'`
            case 'ne': return `${filter.field} != '${filter.value}'`
            case 'in': return `${filter.field} IN (${Array.isArray(filter.value) ? filter.value.map((v: any) => `'${v}'`).join(',') : `'${filter.value}'`})`
            case 'contains': return `${filter.field} LIKE '%${filter.value}%'`
            case 'starts_with': return `${filter.field} LIKE '${filter.value}%'`
            default: return ''
          }
        }).filter(Boolean)
        
        if (filterClauses.length > 0) {
          sql = sql.replace('GROUP BY', `AND ${filterClauses.join(' AND ')}\n    GROUP BY`)
        }
      }

      try {
        const result = await chQuery<Record<string, any>>(sql)
        
        // Post-process data based on parameter type
        let processedData = result;
        
        if (parameter === 'language') {
          processedData = result.map(item => ({
            ...item,
            name: getLanguageName(item.name?.split('-')[0] || item.name) || item.name,
            code: item.name
          }));
        } else if (parameter === 'timezone') {
          processedData = result.map(item => {
            const tz = item.name;
            let displayName = tz;
            
            // Common timezone mappings
            const timezoneNames: Record<string, string> = {
              'UTC': 'UTC (Coordinated Universal Time)',
              'GMT': 'GMT (Greenwich Mean Time)',
              'America/New_York': 'Eastern Time (US & Canada)',
              'America/Chicago': 'Central Time (US & Canada)',
              'America/Denver': 'Mountain Time (US & Canada)',
              'America/Los_Angeles': 'Pacific Time (US & Canada)',
              'America/Anchorage': 'Alaska Time',
              'Pacific/Honolulu': 'Hawaii Time',
              'Europe/London': 'Greenwich Mean Time (UK)',
              'Europe/Paris': 'Central European Time',
              'Europe/Berlin': 'Central European Time',
              'Europe/Rome': 'Central European Time',
              'Europe/Madrid': 'Central European Time',
              'Europe/Amsterdam': 'Central European Time',
              'Europe/Helsinki': 'Eastern European Time',
              'Europe/Athens': 'Eastern European Time',
              'Europe/Moscow': 'Moscow Standard Time',
              'Asia/Tokyo': 'Japan Standard Time',
              'Asia/Shanghai': 'China Standard Time',
              'Asia/Beijing': 'China Standard Time',
              'Asia/Kolkata': 'India Standard Time',
              'Asia/Mumbai': 'India Standard Time',
              'Asia/Dubai': 'Gulf Standard Time',
              'Australia/Sydney': 'Australian Eastern Time',
              'Australia/Melbourne': 'Australian Eastern Time',
              'Australia/Perth': 'Australian Western Time',
              'Pacific/Auckland': 'New Zealand Standard Time',
              'America/Sao_Paulo': 'Brasília Time',
              'America/Argentina/Buenos_Aires': 'Argentina Time',
              'Africa/Cairo': 'Eastern European Time',
              'Africa/Johannesburg': 'South Africa Standard Time'
            };
            
            displayName = timezoneNames[tz] || tz.replace(/_/g, ' ').replace('/', ' / ');
            
            // Try to get current time in timezone
            let currentTime = '';
            try {
              const now = new Date();
              currentTime = now.toLocaleTimeString('en-US', { 
                timeZone: tz,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              });
            } catch {
              // If timezone is invalid, skip time display
            }
            
            return {
              ...item,
              name: displayName,
              code: tz,
              current_time: currentTime
            };
          });
        }
        
        return {
          parameter,
          data: processedData,
          success: true
        }
      } catch (error: any) {
        return {
          parameter,
          data: [],
          success: false,
          error: error.message
        }
      }
    })
  )

  return {
    success: true,
    queryId: query.id,
    data: results,
    meta: {
      parameters: parameters,
      total_parameters: parameters.length,
      page,
      limit,
      filters_applied: filters.length
    }
  }
}

// Main dynamic query endpoint - supports both single and batch queries
queryRouter.post(
  '/',
  zValidator('json', batchQuerySchema),
  async (c) => {
    const requestData = c.req.valid('json')
    const website = c.get('website')

    try {
      if (!website?.id) {
        return c.json({ success: false, error: 'Invalid website access' }, 403)
      }

      // Determine if it's a single query or batch
      const queries = Array.isArray(requestData) ? requestData : [requestData]
      
      // Process all queries in parallel
      const results = await Promise.all(
        queries.map(async (query, index) => {
          try {
            // Add a default ID if not provided
            const queryWithId = {
              ...query,
              id: query.id || `query_${index}`
            }
            return await processSingleQuery(queryWithId, website.id)
          } catch (error: any) {
            return {
              success: false,
              error: error.message,
              queryId: query.id || `query_${index}`
            }
          }
        })
      )

      // If it was a single query, return single result format for backward compatibility
      if (!Array.isArray(requestData)) {
        return c.json(results[0])
      }

      // Return batch results
      return c.json({
        success: true,
        batch: true,
        results: results,
        meta: {
          total_queries: queries.length,
          successful_queries: results.filter(r => r.success).length,
          failed_queries: results.filter(r => !r.success).length
        }
      })

    } catch (error: any) {
      logger.error('Batch query failed', {
        error: error.message,
        website_id: website.id,
        queries_count: Array.isArray(requestData) ? requestData.length : 1
      })
      
      return c.json({ 
        success: false, 
        error: 'Query processing failed'
      }, 500)
    }
  }
)

// Get available parameters
queryRouter.get('/parameters', async (c) => {
  return c.json({
    success: true,
    parameters: Object.keys(PARAMETER_BUILDERS),
    categories: {
      device: ['device_type', 'browser_name', 'os_name'],
      geography: ['country', 'region', 'timezone', 'language'],
      pages: ['top_pages', 'exit_page'],
      utm: ['utm_source', 'utm_medium', 'utm_campaign'],
      referrers: ['referrer'],
      performance: ['slow_pages']
    }
  })
})

export default queryRouter 