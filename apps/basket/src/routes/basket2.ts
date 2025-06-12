import { Elysia } from 'elysia'
import { AnalyticsEvent, ErrorEvent, WebVitalsEvent, clickHouse } from '@databuddy/db'
import { randomUUID } from 'node:crypto'
import { getGeo } from '../utils/ip-geo'
import { parseUserAgent } from '../utils/user-agent'
import { getWebsiteById, isValidOrigin } from '../hooks/auth'
import { 
  validatePayloadSize, 
  sanitizeString, 
  validateSessionId,
  validatePerformanceMetric,
  VALIDATION_LIMITS 
} from '../utils/validation'
import { getRedisCache } from '@databuddy/redis'

const redis = getRedisCache()

async function insertError(errorData: any, clientId: string): Promise<void> {
  const eventId = sanitizeString(errorData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  
  // Check for duplicate
  if (await checkDuplicate(eventId, 'error')) {
    return // Skip duplicate
  }

  const errorEvent: ErrorEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_id: errorData.payload.eventId,
    anonymous_id: errorData.payload.anonymousId,
    session_id: errorData.payload.sessionId,
    timestamp: errorData.payload.timestamp,
    path: errorData.payload.path,
    message: errorData.payload.message,
    filename: errorData.payload.filename,
    lineno: errorData.payload.lineno,
    colno: errorData.payload.colno,
    stack: errorData.payload.stack,
    error_type: errorData.payload.errorType,
    created_at: new Date().getTime()
  }

  await clickHouse.insert({
    table: 'analytics.errors',
    values: [errorEvent],
    format: 'JSONEachRow'
  })
}

async function insertWebVitals(vitalsData: any, clientId: string): Promise<void> {
  const eventId = sanitizeString(vitalsData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  
  // Check for duplicate
  if (await checkDuplicate(eventId, 'web_vitals')) {
    return // Skip duplicate
  }

  const webVitalsEvent: WebVitalsEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_id: vitalsData.payload.eventId,
    anonymous_id: vitalsData.payload.anonymousId,
    session_id: vitalsData.payload.sessionId,
    timestamp: vitalsData.payload.timestamp,
    path: vitalsData.payload.path,
    fcp: vitalsData.payload.fcp,
    lcp: vitalsData.payload.lcp,
    cls: vitalsData.payload.cls,
    fid: vitalsData.payload.fid,
    inp: vitalsData.payload.inp,
    created_at: new Date().getTime()
  }

  await clickHouse.insert({
    table: 'analytics.web_vitals',
    values: [webVitalsEvent],
    format: 'JSONEachRow'
  })
}

async function insertTrackEvent(trackData: any, clientId: string, userAgent: string, ip: string): Promise<void> {
  const eventId = sanitizeString(trackData.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  
  // Check for duplicate
  if (await checkDuplicate(eventId, 'track')) {
    return // Skip duplicate
  }

  const { anonymizedIP, country, region } = await getGeo(ip)
  const { browserName, browserVersion, osName, osVersion, deviceType, deviceBrand, deviceModel } = parseUserAgent(userAgent)
  
  const trackEvent: AnalyticsEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_name: sanitizeString(trackData.name, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    anonymous_id: sanitizeString(trackData.anonymousId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    time: validatePerformanceMetric(trackData.timestamp),
    session_id: validateSessionId(trackData.sessionId),
    event_type: 'track',
    event_id: sanitizeString(trackData.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    session_start_time: validatePerformanceMetric(trackData.sessionStartTime),
    timestamp: validatePerformanceMetric(trackData.timestamp),
    
    // Page context
    referrer: sanitizeString(trackData.referrer, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    url: sanitizeString(trackData.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    path: sanitizeString(trackData.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    title: sanitizeString(trackData.title, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    
    ip: anonymizedIP,
    user_agent: null,
    browser_name: browserName,
    browser_version: browserVersion,
    os_name: osName,
    os_version: osVersion,
    device_type: deviceType,
    device_brand: deviceBrand,
    device_model: deviceModel,
    country: country,
    region: region,
    city: null, // No thanks
    
    // User context
    screen_resolution: trackData.screen_resolution,
    viewport_size: trackData.viewport_size,
    language: trackData.language,
    timezone: trackData.timezone,
    
    // Connection info
    connection_type: trackData.connection_type,
    rtt: trackData.rtt,
    downlink: trackData.downlink,
    
    // Engagement metrics
    time_on_page: trackData.time_on_page,
    scroll_depth: trackData.scroll_depth,
    interaction_count: trackData.interaction_count,
    exit_intent: trackData.exit_intent || 0,
    page_count: trackData.page_count || 1,
    is_bounce: trackData.is_bounce || 0,
    has_exit_intent: trackData.has_exit_intent,
    page_size: trackData.page_size,
    
    // UTM parameters
    utm_source: trackData.utm_source,
    utm_medium: trackData.utm_medium,
    utm_campaign: trackData.utm_campaign,
    utm_term: trackData.utm_term,
    utm_content: trackData.utm_content,
    
    // Performance metrics
    load_time: validatePerformanceMetric(trackData.load_time),
    dom_ready_time: validatePerformanceMetric(trackData.dom_ready_time),
    dom_interactive: validatePerformanceMetric(trackData.dom_interactive),
    ttfb: validatePerformanceMetric(trackData.ttfb),
    connection_time: validatePerformanceMetric(trackData.connection_time),
    request_time: validatePerformanceMetric(trackData.request_time),
    render_time: validatePerformanceMetric(trackData.render_time),
    redirect_time: validatePerformanceMetric(trackData.redirect_time),
    domain_lookup_time: validatePerformanceMetric(trackData.domain_lookup_time),
    
    // Web Vitals
    fcp: validatePerformanceMetric(trackData.fcp),
    lcp: validatePerformanceMetric(trackData.lcp),
    cls: validatePerformanceMetric(trackData.cls),
    fid: validatePerformanceMetric(trackData.fid),
    inp: validatePerformanceMetric(trackData.inp),
    
    // Link tracking
    href: trackData.href,
    text: trackData.text,
    
    // Custom event value
    value: trackData.value,
    
    // Error tracking (not used for track events)
    error_message: undefined,
    error_filename: undefined,
    error_lineno: undefined,
    error_colno: undefined,
    error_stack: undefined,
    error_type: undefined,
    
    // Legacy properties
    properties: '{}',
    
    // Metadata
    created_at: new Date().getTime()
  }

  await clickHouse.insert({
    table: 'analytics.events',
    values: [trackEvent],
    format: 'JSONEachRow'
  })
}

async function checkDuplicate(eventId: string, eventType: string): Promise<boolean> {
  const key = `dedup:${eventType}:${eventId}`
  const exists = await redis.exists(key)
  
  if (exists) {
    return true
  }
  
  await redis.setex(key, 86400, '1')
  return false
}

const app = new Elysia()
  .post('/', async ({ body, query, request }: { body: any, query: any, request: Request }) => {
    if (!validatePayloadSize(body, VALIDATION_LIMITS.PAYLOAD_MAX_SIZE)) {
      return { status: 'error', message: 'Payload too large' }
    }
    
    const eventType = body.type || 'track'
    const clientId = sanitizeString(query.client_id, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
    
    // Auth check
    if (!clientId) {
      return { status: 'error', message: 'Missing client ID' }
    }
    
    const website = await getWebsiteById(clientId)
    if (!website || website.status !== 'ACTIVE') {
      return { status: 'error', message: 'Invalid or inactive client ID' }
    }
    
    const origin = request.headers.get('origin')
    if (origin && !isValidOrigin(origin, website.domain)) {
      return { status: 'error', message: 'Origin not authorized' }
    }
    
    const userAgent = sanitizeString(request.headers.get('user-agent'), VALIDATION_LIMITS.STRING_MAX_LENGTH) || ''
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    
    if (eventType === 'track') {
      await insertTrackEvent(body, clientId, userAgent, ip)
      return { status: 'success', type: 'track' }
    }
    
    if (eventType === 'error') {
      await insertError(body, clientId)
      return { status: 'success', type: 'error' }
    }
    
    if (eventType === 'web_vitals') {
      await insertWebVitals(body, clientId)
      return { status: 'success', type: 'web_vitals' }
    }
    
    return { status: 'error', message: 'Unknown event type' }
  })

export default app
