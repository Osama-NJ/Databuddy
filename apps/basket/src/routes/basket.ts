import { Elysia } from 'elysia'
import { AnalyticsEvent, ErrorEvent, WebVitalsEvent, BlockedTraffic, clickHouse } from '@databuddy/db'
import { createHash, randomUUID } from 'node:crypto'
import { getGeo, extractIpFromRequest } from '../utils/ip-geo'
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
import { bots } from '@databuddy/shared'
import crypto from 'node:crypto'

const redis = getRedisCache()

async function getDailySalt(): Promise<string> {
  const saltKey = `salt:${Math.floor(Date.now() / (24 * 60 * 60 * 1000))}`
  let salt = await redis.get(saltKey)
  if (!salt) {
    salt = crypto.randomBytes(32).toString('hex')
    await redis.setex(saltKey, 60 * 60 * 24, salt)
  }
  return salt
}

function saltAnonymousId(anonymousId: string, salt: string): string {
  return createHash('sha256').update(anonymousId + salt).digest('hex')
}

async function validateRequest(body: any, query: any, request: Request) {
  // Check payload size first
  if (!validatePayloadSize(body, VALIDATION_LIMITS.PAYLOAD_MAX_SIZE)) {
    await logBlockedTraffic(request, body, query, 'payload_too_large', 'Validation Error')
    return { error: { status: 'error', message: 'Payload too large' } }
  }

  // Check client ID
  const clientId = sanitizeString(query.client_id, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  if (!clientId) {
    await logBlockedTraffic(request, body, query, 'missing_client_id', 'Validation Error')
    return { error: { status: 'error', message: 'Missing client ID' } }
  }

  // Check website validity
  const website = await getWebsiteById(clientId)
  if (!website || website.status !== 'ACTIVE') {
    await logBlockedTraffic(request, body, query, 'invalid_client_id', 'Validation Error', undefined, clientId)
    return { error: { status: 'error', message: 'Invalid or inactive client ID' } }
  }

  // Check origin authorization
  const origin = request.headers.get('origin')
  if (origin && !isValidOrigin(origin, website.domain)) {
    await logBlockedTraffic(request, body, query, 'origin_not_authorized', 'Security Check', undefined, clientId)
    return { error: { status: 'error', message: 'Origin not authorized' } }
  }

  // Check for bots
  const userAgent = sanitizeString(request.headers.get('user-agent'), VALIDATION_LIMITS.STRING_MAX_LENGTH) || ''
  const botCheck = detectBot(userAgent, request)
  if (botCheck.isBot) {
    await logBlockedTraffic(
      request,
      body,
      query,
      botCheck.reason || 'unknown_bot',
      botCheck.category || 'Bot Detection',
      botCheck.botName,
      clientId
    )
    return { error: { status: 'ignored' } }
  }

  const ip = extractIpFromRequest(request)

  return {
    success: true,
    clientId,
    userAgent,
    ip
  }
}

function detectBot(userAgent: string, request: Request): {
  isBot: boolean;
  reason?: string;
  category?: string;
  botName?: string
} {
  const ua = userAgent?.toLowerCase() || '';

  // Check for known bots
  const detectedBot = bots.find(bot => ua.includes(bot.regex.toLowerCase()));
  if (detectedBot) {
    return {
      isBot: true,
      reason: 'known_bot_user_agent',
      category: 'Known Bot',
      botName: detectedBot.name
    };
  }

  // Missing user agent
  if (!userAgent) {
    return {
      isBot: true,
      reason: 'missing_user_agent',
      category: 'Missing Headers'
    };
  }

  // Missing accept header
  if (!request.headers.get('accept')) {
    return {
      isBot: true,
      reason: 'missing_accept_header',
      category: 'Missing Headers'
    };
  }

  // User agent too short
  if (ua.length < 10) {
    return {
      isBot: true,
      reason: 'user_agent_too_short',
      category: 'Suspicious Pattern'
    };
  }

  return { isBot: false };
}


async function insertError(errorData: any, clientId: string): Promise<void> {
  const eventId = sanitizeString(errorData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  if (await checkDuplicate(eventId, 'error')) return

  const payload = errorData.payload
  const now = new Date().getTime()

  const errorEvent: ErrorEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_id: eventId,
    anonymous_id: sanitizeString(payload.anonymousId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    session_id: validateSessionId(payload.sessionId),
    timestamp: typeof payload.timestamp === 'number' ? payload.timestamp : now,
    path: sanitizeString(payload.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    message: sanitizeString(payload.message, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    filename: sanitizeString(payload.filename, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    lineno: payload.lineno,
    colno: payload.colno,
    stack: sanitizeString(payload.stack, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    error_type: sanitizeString(payload.errorType, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    created_at: now
  }

  await clickHouse.insert({
    table: 'analytics.errors',
    values: [errorEvent],
    format: 'JSONEachRow'
  })
}

async function insertWebVitals(vitalsData: any, clientId: string): Promise<void> {
  const eventId = sanitizeString(vitalsData.payload.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  if (await checkDuplicate(eventId, 'web_vitals')) return

  const payload = vitalsData.payload
  const now = new Date().getTime()

  const webVitalsEvent: WebVitalsEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_id: eventId,
    anonymous_id: sanitizeString(payload.anonymousId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    session_id: validateSessionId(payload.sessionId),
    timestamp: typeof payload.timestamp === 'number' ? payload.timestamp : now,
    path: sanitizeString(payload.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    fcp: validatePerformanceMetric(payload.fcp),
    lcp: validatePerformanceMetric(payload.lcp),
    cls: validatePerformanceMetric(payload.cls),
    fid: validatePerformanceMetric(payload.fid),
    inp: validatePerformanceMetric(payload.inp),
    created_at: now
  }

  await clickHouse.insert({
    table: 'analytics.web_vitals',
    values: [webVitalsEvent],
    format: 'JSONEachRow'
  })
}

async function insertTrackEvent(trackData: any, clientId: string, userAgent: string, ip: string): Promise<void> {
  const eventId = sanitizeString(trackData.eventId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH)
  if (await checkDuplicate(eventId, 'track')) return

  const { anonymizedIP, country, region } = await getGeo(ip)
  const { browserName, browserVersion, osName, osVersion, deviceType, deviceBrand, deviceModel } = parseUserAgent(userAgent)
  const now = new Date().getTime()

  const trackEvent: AnalyticsEvent = {
    id: randomUUID(),
    client_id: clientId,
    event_name: sanitizeString(trackData.name, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    anonymous_id: sanitizeString(trackData.anonymousId, VALIDATION_LIMITS.SHORT_STRING_MAX_LENGTH),
    time: typeof trackData.timestamp === 'number' ? trackData.timestamp : now,
    session_id: validateSessionId(trackData.sessionId),
    event_type: 'track',
    event_id: eventId,
    session_start_time: typeof trackData.sessionStartTime === 'number' ? trackData.sessionStartTime : now,
    timestamp: typeof trackData.timestamp === 'number' ? trackData.timestamp : now,

    referrer: sanitizeString(trackData.referrer, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    url: sanitizeString(trackData.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    path: sanitizeString(trackData.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
    title: sanitizeString(trackData.title, VALIDATION_LIMITS.STRING_MAX_LENGTH),

    ip: anonymizedIP || null,
    user_agent: sanitizeString(userAgent, VALIDATION_LIMITS.STRING_MAX_LENGTH) || null,
    browser_name: browserName || null,
    browser_version: browserVersion || null,
    os_name: osName || null,
    os_version: osVersion || null,
    device_type: deviceType || null,
    device_brand: deviceBrand || null,
    device_model: deviceModel || null,
    country: country || null,
    region: region || null,
    city: null,

    screen_resolution: trackData.screen_resolution,
    viewport_size: trackData.viewport_size,
    language: trackData.language,
    timezone: trackData.timezone,

    connection_type: trackData.connection_type,
    rtt: trackData.rtt,
    downlink: trackData.downlink,

    time_on_page: trackData.time_on_page,
    scroll_depth: trackData.scroll_depth,
    interaction_count: trackData.interaction_count,
    exit_intent: trackData.exit_intent || 0,
    page_count: trackData.page_count || 1,
    is_bounce: trackData.is_bounce || 0,
    has_exit_intent: trackData.has_exit_intent,
    page_size: trackData.page_size,

    utm_source: trackData.utm_source,
    utm_medium: trackData.utm_medium,
    utm_campaign: trackData.utm_campaign,
    utm_term: trackData.utm_term,
    utm_content: trackData.utm_content,

    load_time: validatePerformanceMetric(trackData.load_time),
    dom_ready_time: validatePerformanceMetric(trackData.dom_ready_time),
    dom_interactive: validatePerformanceMetric(trackData.dom_interactive),
    ttfb: validatePerformanceMetric(trackData.ttfb),
    connection_time: validatePerformanceMetric(trackData.connection_time),
    request_time: validatePerformanceMetric(trackData.request_time),
    render_time: validatePerformanceMetric(trackData.render_time),
    redirect_time: validatePerformanceMetric(trackData.redirect_time),
    domain_lookup_time: validatePerformanceMetric(trackData.domain_lookup_time),

    fcp: validatePerformanceMetric(trackData.fcp),
    lcp: validatePerformanceMetric(trackData.lcp),
    cls: validatePerformanceMetric(trackData.cls),
    fid: validatePerformanceMetric(trackData.fid),
    inp: validatePerformanceMetric(trackData.inp),

    href: trackData.href,
    text: trackData.text,
    value: trackData.value,

    error_message: undefined,
    error_filename: undefined,
    error_lineno: undefined,
    error_colno: undefined,
    error_stack: undefined,
    error_type: undefined,

    properties: '{}',
    created_at: now
  }

  await clickHouse.insert({
    table: 'analytics.events',
    values: [trackEvent],
    format: 'JSONEachRow'
  })

}

async function checkDuplicate(eventId: string, eventType: string): Promise<boolean> {
  const key = `dedup:${eventType}:${eventId}`
  if (await redis.exists(key)) return true

  const ttl = eventId.startsWith('exit_') ? 172800 : 86400
  await redis.setex(key, ttl, '1')
  return false
}

async function logBlockedTraffic(request: Request, body: any, query: any, blockReason: string, blockCategory: string, botName?: string, clientId?: string): Promise<void> {
  try {
    const ip = extractIpFromRequest(request)
    const userAgent = sanitizeString(request.headers.get('user-agent'), VALIDATION_LIMITS.STRING_MAX_LENGTH) || ''

    // Try to get basic geo and user agent info even for blocked requests
    const { anonymizedIP, country, region } = await getGeo(ip)
    const { browserName, browserVersion, osName, osVersion, deviceType } = parseUserAgent(userAgent)

    const now = new Date().getTime()

    const blockedEvent: BlockedTraffic = {
      id: randomUUID(),
      client_id: clientId || null,
      timestamp: now,

      // Request details
      path: sanitizeString(body?.path, VALIDATION_LIMITS.STRING_MAX_LENGTH),
      url: sanitizeString(body?.url || body?.href, VALIDATION_LIMITS.STRING_MAX_LENGTH),
      referrer: sanitizeString(body?.referrer || request.headers.get('referer'), VALIDATION_LIMITS.STRING_MAX_LENGTH),
      method: 'POST',
      origin: sanitizeString(request.headers.get('origin'), VALIDATION_LIMITS.STRING_MAX_LENGTH),

      // Client information
      ip: anonymizedIP || ip,
      user_agent: userAgent || null,
      accept_header: sanitizeString(request.headers.get('accept'), VALIDATION_LIMITS.STRING_MAX_LENGTH),
      language: sanitizeString(request.headers.get('accept-language'), VALIDATION_LIMITS.STRING_MAX_LENGTH),

      // Blocking details
      block_reason: blockReason,
      block_category: blockCategory,
      bot_name: botName || null,

      // Enriched data (when possible)
      country: country || null,
      region: region || null,
      browser_name: browserName || null,
      browser_version: browserVersion || null,
      os_name: osName || null,
      os_version: osVersion || null,
      device_type: deviceType || null,

      // Payload size for size-related blocks
      payload_size: blockReason === 'payload_too_large' ? JSON.stringify(body || {}).length : null,

      created_at: now
    }

    await clickHouse.insert({
      table: 'analytics.blocked_traffic',
      values: [blockedEvent],
      format: 'JSONEachRow'
    })
  } catch (error) {
    // Don't let logging errors break the main flow
    console.error('Failed to log blocked traffic:', error)
  }
}

const app = new Elysia()
  .post('/', async ({ body, query, request }: { body: any, query: any, request: Request }) => {
    const validation = await validateRequest(body, query, request)
    if (!validation.success) return validation.error

    const { clientId, userAgent, ip } = validation

    const salt = await getDailySalt()
    if (body.anonymous_id) {
      body.anonymous_id = saltAnonymousId(body.anonymous_id, salt)
    }

    const eventType = body.type || 'track'

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
  .post('/batch', async ({ body, query, request }: { body: any, query: any, request: Request }) => {
    if (!Array.isArray(body)) {
      return { status: 'error', message: 'Batch endpoint expects array of events' }
    }

    if (body.length > VALIDATION_LIMITS.BATCH_MAX_SIZE) {
      return { status: 'error', message: 'Batch too large' }
    }

    const validation = await validateRequest(body, query, request)
    if (!validation.success) return { ...validation.error, batch: true }

    const { clientId, userAgent, ip } = validation

    const salt = await getDailySalt()
    for (const event of body) {
      if (event.anonymous_id) {
        event.anonymous_id = saltAnonymousId(event.anonymous_id, salt)
      }
    }

    const results = []
    for (const event of body) {
      const eventType = event.type || 'track'

      try {
        if (eventType === 'track') {
          await insertTrackEvent(event, clientId, userAgent, ip)
          results.push({ status: 'success', type: 'track', eventId: event.eventId })
        } else if (eventType === 'error') {
          await insertError(event, clientId)
          results.push({ status: 'success', type: 'error', eventId: event.payload?.eventId })
        } else if (eventType === 'web_vitals') {
          await insertWebVitals(event, clientId)
          results.push({ status: 'success', type: 'web_vitals', eventId: event.payload?.eventId })
        } else {
          results.push({ status: 'error', message: 'Unknown event type', eventType })
        }
      } catch (error) {
        results.push({ status: 'error', message: 'Processing failed', eventType, error: String(error) })
      }
    }

    return { status: 'success', batch: true, processed: results.length, results }
  })

export default app
