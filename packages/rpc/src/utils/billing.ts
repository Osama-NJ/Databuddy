import { Autumn } from 'autumn-js';
import { db, member, eq, and } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';

const autumn = new Autumn();

/**
 * For creation, checks the limit and tracks usage in one call if allowed.
 * This is an optimized call that uses `send_event`.
 */
export async function checkAndTrackWebsiteCreation(customerId: string) {
    if (!customerId) {
        return { allowed: true };
    }
    try {
        const { data } = await autumn.check({
            customer_id: customerId,
            feature_id: "websites",
            send_event: true,
        });

        if (data && !data.allowed) {
            return { allowed: false, error: "Website creation limit exceeded" };
        }
        return { allowed: true };
    } catch (error) {
        console.error(`[Billing Util] Error with autumn checkAndTrack:`, { error });
        // Fail open on billing errors to not block user.
        return { allowed: true };
    }
}

/**
 * For deletion or other discrete tracking events.
 */
export async function trackWebsiteUsage(customerId: string, value: number) {
    if (!customerId) {
        return { success: false };
    }
    try {
        await autumn.track({
            customer_id: customerId,
            feature_id: "websites",
            value,
        });
        return { success: true };
    } catch (error) {
        console.error(`[Billing Util] Error with autumn track:`, { error });
        return { success: false };
    }
}

async function _getOrganizationOwnerId(organizationId: string): Promise<string | null> {
    if (!organizationId) return null;
    try {
        const orgMember = await db.query.member.findFirst({
            where: and(
                eq(member.organizationId, organizationId),
                eq(member.role, "owner"),
            ),
            columns: { userId: true },
        });
        return orgMember?.userId || null;
    } catch (error) {
        console.error(`[Billing Util] Error with _getOrganizationOwnerId:`, { error });
        return null;
    }
}

const getOrganizationOwnerId = cacheable(_getOrganizationOwnerId, {
    expireInSec: 300,
    prefix: "rpc:org_owner",
});

/**
 * Determines the customer ID for billing purposes.
 * If an organization is involved, it traces back to the organization's owner.
 * Otherwise, it defaults to the user's ID.
 * @returns The ID of the user or the organization owner.
 */
export async function getBillingCustomerId(
    userId: string,
    organizationId?: string | null,
): Promise<string> {
    if (!organizationId) {
        return userId;
    }

    const orgOwnerId = await getOrganizationOwnerId(organizationId);
    return orgOwnerId || userId;
} 