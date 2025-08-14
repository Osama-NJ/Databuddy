/**
 * User Agent Utilities
 *
 * Provides functions for user agent analysis including bot detection
 * and platform identification.
 */

import { logger } from '@databuddy/shared/utils';
import { bots } from '@databuddy/shared/lists';
import { UAParser } from 'ua-parser-js';

export interface UserAgentInfo {
	bot: {
		isBot: boolean;
		name?: string;
		type?: string;
	};
	browser?: string;
	os?: string;
	device?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

/**
 * Parse user agent to extract useful information
 */
export function parseUserAgent(userAgent: string): {
	browserName?: string;
	browserVersion?: string;
	osName?: string;
	osVersion?: string;
	deviceType?: string;
	deviceBrand?: string;
	deviceModel?: string;
} {
	if (!userAgent) {
		return {
			browserName: undefined,
			browserVersion: undefined,
			osName: undefined,
			osVersion: undefined,
			deviceType: undefined,
			deviceBrand: undefined,
			deviceModel: undefined,
		};
	}

	try {
		const parser = new UAParser(userAgent);
		const result = parser.getResult();

		return {
			browserName: result.browser.name || undefined,
			browserVersion: result.browser.version || undefined,
			osName: result.os.name || undefined,
			osVersion: result.os.version || undefined,
			deviceType: result.device.type || undefined,
			deviceBrand: result.device.vendor || undefined,
			deviceModel: result.device.model || undefined,
		};
	} catch (error) {
		logger.error(
			'User Agent Parse Error',
			`Failed to parse user agent: ${userAgent}`,
			{
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		);
		return {
			browserName: undefined,
			browserVersion: undefined,
			osName: undefined,
			osVersion: undefined,
			deviceType: undefined,
			deviceBrand: undefined,
			deviceModel: undefined,
		};
	}
}

// Precompile bot regexes once to avoid per-request overhead
const compiledBotRegexes = bots.map((bot) => ({
	name: bot.name,
	category: bot.category,
	regex: new RegExp(bot.regex, 'i'),
}));

export function detectBot(
	userAgent: string,
	request: Request
): {
	isBot: boolean;
	reason?: string;
	category?: string;
	botName?: string;
} {
	const ua = userAgent || '';

	const detectedBot = compiledBotRegexes.find((bot) => bot.regex.test(ua));
	if (detectedBot) {
		return {
			isBot: true,
			reason: 'known_bot_user_agent',
			category: 'Known Bot',
			botName: detectedBot.name,
		};
	}

	if (!userAgent) {
		return {
			isBot: true,
			reason: 'missing_user_agent',
			category: 'Missing Headers',
		};
	}

	if (!request.headers.get('accept')) {
		return {
			isBot: true,
			reason: 'missing_accept_header',
			category: 'Missing Headers',
		};
	}

	if (ua.length < 10) {
		return {
			isBot: true,
			reason: 'user_agent_too_short',
			category: 'Suspicious Pattern',
		};
	}

	return { isBot: false };
}
