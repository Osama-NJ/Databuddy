import { and, db, eq, member } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import { logger } from '@databuddy/shared';
import { Autumn } from 'autumn-js';

const autumn = new Autumn();

export async function checkAndTrackWebsiteCreation(customerId: string) {
	if (!customerId) {
		return { allowed: true };
	}
	try {
		const { data } = await autumn.check({
			customer_id: customerId,
			feature_id: 'websites',
			send_event: true,
		});

		if (data && !data.allowed) {
			return { allowed: false, error: 'Website creation limit exceeded' };
		}
		return { allowed: true };
	} catch (error) {
		logger.error('[Billing Util] Error with autumn checkAndTrack:', { error });
		return { allowed: true };
	}
}

export async function trackWebsiteUsage(customerId: string, value: number) {
	if (!customerId) {
		return { success: false };
	}
	try {
		await autumn.track({
			customer_id: customerId,
			feature_id: 'websites',
			value,
		});
		return { success: true };
	} catch (error) {
		logger.error('[Billing Util] Error with autumn track:', { error });
		return { success: false };
	}
}

async function _getOrganizationOwnerId(
	organizationId: string
): Promise<string | null> {
	if (!organizationId) {
		return null;
	}
	try {
		const orgMember = await db.query.member.findFirst({
			where: and(
				eq(member.organizationId, organizationId),
				eq(member.role, 'owner')
			),
			columns: { userId: true },
		});
		return orgMember?.userId || null;
	} catch (error) {
		logger.error(
			'[Billing Util] Error with _getOrganizationOwnerId:',
			error as Error
		);
		return null;
	}
}

const getOrganizationOwnerId = cacheable(_getOrganizationOwnerId, {
	expireInSec: 300,
	prefix: 'rpc:org_owner',
});

/**
 * Determines the customer ID for billing purposes.
 * If an organization is involved, it traces back to the organization's owner.
 * Otherwise, it defaults to the user's ID.
 * @returns The ID of the user or the organization owner.
 */
export async function getBillingCustomerId(
	userId: string,
	organizationId?: string | null
): Promise<string> {
	if (!organizationId) {
		return userId;
	}

	const orgOwnerId = await getOrganizationOwnerId(organizationId);
	return orgOwnerId || userId;
}
