'use server';

interface CustomEventData {
	clientId: string;
	name: string;
	anonymousId?: string;
	sessionId?: string;
	timestamp?: number;
	properties?: Record<string, any>;
}

export async function sendCustomEvent(data: CustomEventData) {
	try {
		const payload = {
			type: 'custom',
			name: data.name,
			...(data.anonymousId && { anonymousId: data.anonymousId }),
			...(data.sessionId && { sessionId: data.sessionId }),
			...(data.timestamp && { timestamp: data.timestamp }),
			...(data.properties && { properties: data.properties }),
		};

		const response = await fetch(
			`https://basket.databuddy.cc/?client_id=${data.clientId}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}
		);

		const result = await response.json();

		if (!response.ok) {
			throw new Error(
				result.message || `HTTP ${response.status}: ${response.statusText}`
			);
		}

		return result;
	} catch (error) {
		console.error('Failed to send custom event:', error);
		throw error;
	}
}

export async function sendBatchCustomEvents(
	clientId: string,
	events: CustomEventData[]
) {
	try {
		const payload = events.map((event) => ({
			type: 'custom',
			name: event.name,
			...(event.anonymousId && { anonymousId: event.anonymousId }),
			...(event.sessionId && { sessionId: event.sessionId }),
			...(event.timestamp && { timestamp: event.timestamp }),
			...(event.properties && { properties: event.properties }),
		}));

		const response = await fetch(
			`https://basket.databuddy.cc/batch?client_id=${clientId}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}
		);

		const result = await response.json();

		if (!response.ok) {
			throw new Error(
				result.message || `HTTP ${response.status}: ${response.statusText}`
			);
		}

		return result;
	} catch (error) {
		console.error('Failed to send batch custom events:', error);
		throw error;
	}
}
