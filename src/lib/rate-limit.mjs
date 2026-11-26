import { createHmac } from "node:crypto";

/**
 * Prefer Vercel's single-address header. The first forwarded address is a
 * fallback for compatible reverse proxies.
 *
 * @param {Request} request
 * @returns {string|null}
 */
export function getTrustedClientAddress(request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || null;
}

/**
 * Return a one-way, route-scoped bucket identifier. Raw IP addresses are never
 * sent to or stored in the rate-limit table.
 *
 * @param {string} secret
 * @param {string} scope
 * @param {string} clientAddress
 * @returns {string}
 */
export function createRateLimitBucketKey(secret, scope, clientAddress) {
  if (!secret || !scope || !clientAddress) {
    throw new TypeError("A secret, scope and client address are required.");
  }
  return createHmac("sha256", secret)
    .update("portavero-rate-limit:v1:")
    .update(scope)
    .update(":")
    .update(clientAddress)
    .digest("hex");
}

/**
 * Consume one request from the shared Supabase/Postgres counter.
 *
 * The database function performs an atomic upsert, so concurrent Vercel
 * instances use the same counter. Store failures are fail-closed for routes
 * that protect third-party credits or account recovery.
 *
 * @param {{
 *   request: Request,
 *   scope: string,
 *   limit: number,
 *   windowSeconds: number,
 *   fetchImpl?: typeof fetch,
 *   env?: Record<string, string|undefined>
 * }} options
 * @returns {Promise<{allowed:boolean, unavailable:boolean, remaining?:number, retryAfterSeconds?:number}>}
 */
export async function checkDistributedRateLimit({
  request,
  scope,
  limit,
  windowSeconds,
  fetchImpl = fetch,
  env = process.env
}) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const secret = env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const usesLegacyJwtKey = Boolean(secret && !secret.startsWith("sb_secret_"));
  const clientAddress = getTrustedClientAddress(request);

  if (
    !supabaseUrl ||
    !secret ||
    !clientAddress ||
    !scope ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1 ||
    windowSeconds > 86400
  ) {
    return { allowed: false, unavailable: true };
  }

  let endpoint;
  try {
    endpoint = new URL("/rest/v1/rpc/consume_portavero_rate_limit", supabaseUrl);
    if (endpoint.protocol !== "https:") return { allowed: false, unavailable: true };
  } catch {
    return { allowed: false, unavailable: true };
  }

  const bucketKey = createRateLimitBucketKey(secret, scope, clientAddress);

  try {
    const headers = {
      apikey: secret,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(usesLegacyJwtKey ? { Authorization: "Bearer " + secret } : {})
    };
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_bucket_key: bucketKey,
        p_limit: limit,
        p_window_seconds: windowSeconds
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(2500)
    });

    if (!response.ok) return { allowed: false, unavailable: true };

    const payload = await response.json().catch(() => null);
    const row = Array.isArray(payload) ? payload[0] : payload;
    if (
      !row ||
      typeof row !== "object" ||
      typeof row.allowed !== "boolean" ||
      !Number.isInteger(row.remaining) ||
      row.remaining < 0 ||
      typeof row.reset_at !== "string"
    ) {
      return { allowed: false, unavailable: true };
    }

    const resetAt = Date.parse(row.reset_at);
    if (!Number.isFinite(resetAt)) return { allowed: false, unavailable: true };

    return {
      allowed: row.allowed,
      unavailable: false,
      remaining: row.remaining,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
    };
  } catch {
    return { allowed: false, unavailable: true };
  }
}

/**
 * Build the standard response headers for a blocked request.
 *
 * @param {{unavailable:boolean,retryAfterSeconds?:number}} result
 * @returns {Record<string,string>}
 */
export function rateLimitResponseHeaders(result) {
  return {
    "Cache-Control": "no-store, max-age=0",
    ...(result.unavailable
      ? {}
      : { "Retry-After": String(result.retryAfterSeconds ?? 60) })
  };
}
