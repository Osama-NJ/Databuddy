import { logger } from "../../lib/logger";
import { type Context, Hono } from "hono";
import type { AppVariables } from "../../types";
import { chQuery } from "@databuddy/db";
import { createSqlBuilder } from "../../builders/analytics";
import { createSessionEventsBuilder, createSessionsBuilder, createSessionsWithEventsBuilder } from "../../builders";
import { generateSessionName } from "../../utils/sessions";
import { timezoneMiddleware, useTimezone } from "../../middleware/timezone";
import { formatDuration } from "../../utils/dates";
import { parseUserAgentDetails } from "../../utils/ua";
import { parseReferrer } from "../../utils/referrer";
import { websiteAuthHook } from "../../middleware/website";

const sessionsRouter = new Hono<{ Variables: AppVariables }>();

const mapCountryCode = (country: string): string => {
  return country === 'IL' ? 'PS' : country;
};

// Apply timezone middleware
sessionsRouter.use('*', timezoneMiddleware);
sessionsRouter.use('*', websiteAuthHook());

const formatSessionObject = (session: any, visitorSessionCount: number) => {
  const durationFormatted = formatDuration(session.duration || 0);
  const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
  const referrerInfo = parseReferrer(session.referrer, undefined);
  const sessionName = generateSessionName(session.session_id);

  const { user_agent, events, region, ...sessionWithoutUserAgent } = session;

  let processedEvents: any[] = [];
  if (events && Array.isArray(events)) {
    processedEvents = events.map((eventTuple: any) => {
      const [
        event_id,
        time,
        event_name,
        path,
        error_message,
        error_type,
        properties_json
      ] = eventTuple;

      let properties: Record<string, any> = {};
      if (properties_json) {
        try {
          properties = JSON.parse(properties_json);
        } catch {
          // If parsing fails, keep empty object
        }
      }

      return {
        event_id,
        time,
        event_name,
        path,
        error_message,
        error_type,
        properties
      };
    }).filter(event => event.event_id);
  }

  return {
    ...sessionWithoutUserAgent,
    session_name: sessionName,
    device: userAgentInfo.device_type,
    browser: userAgentInfo.browser_name,
    os: userAgentInfo.os_name,
    duration_formatted: durationFormatted,
    country: mapCountryCode(session.country || ''),
    referrer_parsed: session.referrer ? {
      type: referrerInfo.type,
      name: referrerInfo.name,
      domain: referrerInfo.domain,
    } : null,
    is_returning_visitor: visitorSessionCount > 1,
    visitor_session_count: visitorSessionCount,
    events: processedEvents
  };
};

sessionsRouter.get('/', async (c: Context) => {
  const params = await c.req.query();
  const timezoneInfo = useTimezone(c);
  const page = Number(params.page);
  const limit = Number(params.limit);

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get paginated sessions with events
    const sessionsBuilder = createSessionsWithEventsBuilder(params.website_id, startDate, endDate, limit, offset);

    const sessionsResult = await chQuery(sessionsBuilder.getSql());

    const formattedSessions = sessionsResult.map(session =>
      formatSessionObject(session, 1)
    );

    return c.json({
      success: true,
      sessions: formattedSessions,
      pagination: {
        page,
        limit,
        hasNext: sessionsResult.length === limit,
        hasPrev: page > 1
      },
      date_range: { start_date: startDate, end_date: endDate },
      timezone: {
        timezone: timezoneInfo.timezone,
        detected: timezoneInfo.detected,
        source: timezoneInfo.source
      }
    });
  } catch (error) {
    logger.error('Error retrieving sessions data:', { error, website_id: params.website_id });
    return c.json({ success: false, error: "Error retrieving sessions data" }, 500);
  }
});

sessionsRouter.get('/:session_id', async (c: Context) => {
  const { session_id } = c.req.param();
  const user = c.get('user');
  const website = c.get('website');
  const timezoneInfo = useTimezone(c);

  if (!website?.id) {
    return c.json({ success: false, error: 'Website not found' }, 404);
  }

  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    const sessionDetailBuilder = createSqlBuilder();
    sessionDetailBuilder.sb.select = {
      ...createSessionsBuilder(website.id, '2000-01-01', '2100-01-01', 1).sb.select,
      visitor_total_sessions: `(
        SELECT COUNT(DISTINCT s2.session_id)
        FROM analytics.events s2
        WHERE s2.client_id = events.client_id AND s2.anonymous_id = events.anonymous_id
      ) AS visitor_total_sessions`
    };
    sessionDetailBuilder.sb.from = 'analytics.events';
    sessionDetailBuilder.sb.where = {
      client_filter: `client_id = '${website.id}'`,
      session_filter: `session_id = '${session_id}'`,
    };
    sessionDetailBuilder.sb.groupBy = {
      session_id: 'session_id',
      visitor_id: 'anonymous_id',
      client_id: 'client_id'
    };

    const sessionResult = await chQuery(sessionDetailBuilder.getSql());

    if (!sessionResult.length) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    const session = sessionResult[0];
    const visitorSessionCount = session.visitor_total_sessions || 1;

    const eventsBuilder = createSessionEventsBuilder(website.id, session_id);
    const eventsResult = await chQuery(eventsBuilder.getSql());

    const processedEvents = eventsResult.map(event => {
      const eventUserAgentInfo = parseUserAgentDetails(event.user_agent || '');
      const { user_agent, ...eventWithoutUserAgent } = event;

      return {
        ...eventWithoutUserAgent,
        device_type: eventUserAgentInfo.device_type,
        browser: eventUserAgentInfo.browser_name,
        os: eventUserAgentInfo.os_name,
        country: mapCountryCode(event.country || '')
      };
    });

    const formattedSession = {
      ...formatSessionObject(session, visitorSessionCount),
      events: processedEvents
    };

    return c.json({
      success: true,
      session: formattedSession,
      timezone: {
        timezone: timezoneInfo.timezone,
        detected: timezoneInfo.detected,
        source: timezoneInfo.source
      }
    });
  } catch (error) {
    logger.error('Error retrieving session details:', { error, website_id: website.id, session_id });
    return c.json({ success: false, error: "Error retrieving session details" }, 500);
  }
});

export default sessionsRouter;