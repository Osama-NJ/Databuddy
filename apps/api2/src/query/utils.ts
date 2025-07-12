import { referrers } from "@databuddy/shared";

export interface ParsedReferrer {
    type: string;
    name: string;
    domain: string;
    url: string;
}

/**
 * Parse a referrer URL to identify its source
 */
function parseReferrer(referrerUrl: string | null | undefined, currentDomain?: string | null): ParsedReferrer {
    if (!referrerUrl) {
        return { type: "direct", name: "Direct", url: "", domain: "" };
    }

    try {
        const url = new URL(referrerUrl);
        const hostname = url.hostname;

        // Same domain = direct traffic
        if (currentDomain && (hostname === currentDomain || hostname.endsWith(`.${currentDomain}`))) {
            return { type: "direct", name: "Direct", url: "", domain: "" };
        }

        // Check known referrers
        const match = getReferrerByDomain(hostname);
        if (match) {
            return { type: match.type, name: match.name, url: referrerUrl, domain: hostname };
        }

        // Search engine detection
        if (url.searchParams.has("q") || url.searchParams.has("query") || url.searchParams.has("search")) {
            return { type: "search", name: hostname, url: referrerUrl, domain: hostname };
        }

        return { type: "unknown", name: hostname, url: referrerUrl, domain: hostname };
    } catch {
        return { type: "direct", name: "Direct", url: referrerUrl, domain: "" };
    }
}

function getReferrerByDomain(domain: string): { type: string; name: string } | null {
    if (domain in referrers) {
        const match = referrers[domain];
        return match || null;
    }

    // Try partial domain matching
    const parts = domain.split(".");
    for (let i = 1; i < parts.length - 1; i++) {
        const partial = parts.slice(i).join(".");
        if (partial in referrers) {
            const match = referrers[partial];
            return match || null;
        }
    }
    return null;
}

/**
 * Plugin system for post-processing query results
 */
export function applyPlugins(data: Record<string, any>[], config: any, websiteDomain?: string | null): Record<string, any>[] {
    let result = data;

    // Referrer parsing plugin
    if (config.plugins?.parseReferrers || shouldAutoParseReferrers(config)) {
        result = result.map(row => {
            const referrerUrl = row.name || row.referrer;
            if (!referrerUrl) return row;

            const parsed = parseReferrer(referrerUrl, websiteDomain);

            return {
                ...row,
                name: parsed.name,
                referrer: referrerUrl,
                domain: parsed.domain
            };
        });
    }

    // URL normalization plugin
    if (config.plugins?.normalizeUrls) {
        result = result.map(row => {
            if (row.path) {
                try {
                    const url = new URL(row.path.startsWith('http') ? row.path : `https://example.com${row.path}`);
                    row.path_clean = url.pathname;
                } catch {
                    row.path_clean = row.path;
                }
            }
            return row;
        });
    }

    return result;
}

function shouldAutoParseReferrers(config: any): boolean {
    // Check if this is a referrer-related config by its type/name
    const referrerConfigs = ['top_referrers', 'referrer', 'traffic_sources'];
    return referrerConfigs.includes(config.type || config.name);
} 