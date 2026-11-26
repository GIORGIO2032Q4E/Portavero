import test from "node:test";
import assert from "node:assert/strict";
import {
  checkDistributedRateLimit,
  createRateLimitBucketKey,
  getTrustedClientAddress,
  rateLimitResponseHeaders
} from "./rate-limit.mjs";

function createRequest(headers = {}) {
  return new Request("https://portavero.vercel.app/api/test", { headers });
}

const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test_value"
};

test("prefers the trusted Vercel real-IP header", () => {
  const request = createRequest({
    "x-real-ip": "203.0.113.10",
    "x-forwarded-for": "198.51.100.20, 10.0.0.1"
  });
  assert.equal(getTrustedClientAddress(request), "203.0.113.10");
});

test("uses the first forwarded address when x-real-ip is absent", () => {
  assert.equal(
    getTrustedClientAddress(createRequest({ "x-forwarded-for": "198.51.100.20, 10.0.0.1" })),
    "198.51.100.20"
  );
});

test("creates stable route-scoped hashes without exposing the raw address", () => {
  const first = createRateLimitBucketKey("secret", "vin", "203.0.113.10");
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, createRateLimitBucketKey("secret", "vin", "203.0.113.10"));
  assert.notEqual(first, createRateLimitBucketKey("secret", "auction", "203.0.113.10"));
  assert.notEqual(first, createRateLimitBucketKey("secret", "vin", "203.0.113.11"));
  assert.equal(first.includes("203.0.113.10"), false);
});

test("fails closed when shared rate-limit configuration or client IP is missing", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new Error("should not run"); };
  const missingSecret = await checkDistributedRateLimit({
    request: createRequest({ "x-real-ip": "203.0.113.10" }),
    scope: "vin",
    limit: 20,
    windowSeconds: 3600,
    fetchImpl,
    env: { NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL }
  });
  const missingIp = await checkDistributedRateLimit({
    request: createRequest(),
    scope: "vin",
    limit: 20,
    windowSeconds: 3600,
    fetchImpl,
    env
  });
  assert.deepEqual(missingSecret, { allowed: false, unavailable: true });
  assert.deepEqual(missingIp, { allowed: false, unavailable: true });
  assert.equal(calls, 0);
});

test("sends only a hashed client bucket to the atomic Supabase RPC", async () => {
  let sent;
  const result = await checkDistributedRateLimit({
    request: createRequest({ "x-real-ip": "203.0.113.10" }),
    scope: "vin-standard",
    limit: 40,
    windowSeconds: 3600,
    env,
    fetchImpl: async (url, init) => {
      sent = { url: String(url), init };
      return Response.json([{
        allowed: true,
        remaining: 39,
        reset_at: new Date(Date.now() + 3600000).toISOString()
      }]);
    }
  });

  assert.equal(result.allowed, true);
  assert.equal(result.unavailable, false);
  assert.equal(result.remaining, 39);
  assert.match(sent.url, /\/rest\/v1\/rpc\/consume_portavero_rate_limit$/);
  assert.equal(sent.init.method, "POST");
  assert.equal(sent.init.headers.apikey, env.SUPABASE_SECRET_KEY);
  assert.equal(sent.init.headers.Authorization, undefined);
  const body = JSON.parse(sent.init.body);
  assert.match(body.p_bucket_key, /^[a-f0-9]{64}$/);
  assert.equal(body.p_limit, 40);
  assert.equal(body.p_window_seconds, 3600);
  assert.equal(JSON.stringify(body).includes("203.0.113.10"), false);
});


test("uses Bearer auth only for legacy JWT service-role keys", async () => {
  let sent;
  const legacyKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacy-service-role";
  const result = await checkDistributedRateLimit({
    request: createRequest({ "x-real-ip": "203.0.113.10" }),
    scope: "vin-standard",
    limit: 40,
    windowSeconds: 3600,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: legacyKey
    },
    fetchImpl: async (url, init) => {
      sent = { url: String(url), init };
      return Response.json([{
        allowed: true,
        remaining: 39,
        reset_at: new Date(Date.now() + 3600000).toISOString()
      }]);
    }
  });

  assert.equal(result.allowed, true);
  assert.equal(sent.init.headers.apikey, legacyKey);
  assert.equal(sent.init.headers.Authorization, "Bearer " + legacyKey);
});

test("returns a retry duration when the shared counter denies a request", async () => {
  const result = await checkDistributedRateLimit({
    request: createRequest({ "x-real-ip": "203.0.113.10" }),
    scope: "auction",
    limit: 8,
    windowSeconds: 3600,
    env,
    fetchImpl: async () => Response.json([{
      allowed: false,
      remaining: 0,
      reset_at: new Date(Date.now() + 30000).toISOString()
    }])
  });
  assert.equal(result.allowed, false);
  assert.equal(result.unavailable, false);
  assert.ok(result.retryAfterSeconds >= 1);
  assert.ok(result.retryAfterSeconds <= 30);
  assert.equal(rateLimitResponseHeaders(result)["Retry-After"], String(result.retryAfterSeconds));
});

test("fails closed on Supabase HTTP failures, malformed rows and network errors", async () => {
  const base = {
    request: createRequest({ "x-real-ip": "203.0.113.10" }),
    scope: "password-reset",
    limit: 5,
    windowSeconds: 3600,
    env
  };
  const httpFailure = await checkDistributedRateLimit({ ...base, fetchImpl: async () => new Response("unavailable", { status: 503 }) });
  const invalidPayload = await checkDistributedRateLimit({ ...base, fetchImpl: async () => Response.json([{ allowed: "yes" }]) });
  const networkFailure = await checkDistributedRateLimit({ ...base, fetchImpl: async () => { throw new Error("network down"); } });
  for (const result of [httpFailure, invalidPayload, networkFailure]) {
    assert.deepEqual(result, { allowed: false, unavailable: true });
  }
});

test("unavailable responses never publish a retry header as if a limit was reached", () => {
  assert.deepEqual(rateLimitResponseHeaders({ unavailable: true }), { "Cache-Control": "no-store, max-age=0" });
});
