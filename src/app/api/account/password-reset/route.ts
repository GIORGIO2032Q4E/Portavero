import { NextResponse } from "next/server";
import { checkDistributedRateLimit, rateLimitResponseHeaders } from "@/lib/rate-limit.mjs";
import { angarisheEmailValiduria, normalizireAngarishisEmail } from "@/lib/account-validation.mjs";

export const runtime = "nodejs";

function pasuxiJson(body: Record<string, unknown>, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache", ...extraHeaders }
  });
}

function arisChanaceri(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  const originHeader = request.headers.get("origin");
  const host = request.headers.get("host");
  let igiveOriginia = false;
  if (originHeader && host) {
    try {
      const origin = new URL(originHeader);
      const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
      const requestProtocol = forwardedProtocol ? `${forwardedProtocol}:` : new URL(request.url).protocol;
      igiveOriginia = origin.host.toLowerCase() === host.toLowerCase() && origin.protocol === requestProtocol;
    } catch {
      igiveOriginia = false;
    }
  }
  if (!igiveOriginia) {
    return pasuxiJson({ code: "origin_rejected", error: "This password-reset request was rejected." }, 403);
  }

  const body: unknown = await request.json().catch(() => null);
  const rawEmail = arisChanaceri(body) && typeof body.email === "string" ? body.email : "";
  const email = normalizireAngarishisEmail(rawEmail);
  if (!angarisheEmailValiduria(email)) {
    return pasuxiJson({ code: "invalid_email", error: "Enter a valid email address." }, 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publicKey) {
    return pasuxiJson({ code: "server_not_configured", error: "Password reset is temporarily unavailable." }, 503);
  }

  const rateLimit = await checkDistributedRateLimit({
    request,
    scope: "account:password-reset",
    limit: 5,
    windowSeconds: 3600
  });
  if (!rateLimit.allowed) {
    return pasuxiJson(
      {
        code: rateLimit.unavailable ? "rate_limit_unavailable" : "rate_limited",
        error: rateLimit.unavailable
          ? "Password reset is temporarily unavailable. Please try again shortly."
          : "Too many reset requests. Please wait before trying again."
      },
      rateLimit.unavailable ? 503 : 429,
      rateLimitResponseHeaders(rateLimit)
    );
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");
  const redirectTo = new URL("/account?reset=1", siteUrl);
  const recoveryUrl = new URL(supabaseUrl + "/auth/v1/recover");
  recoveryUrl.searchParams.set("redirect_to", redirectTo.toString());

  try {
    const response = await fetch(recoveryUrl, {
      method: "POST",
      headers: { apikey: publicKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 429) {
      return pasuxiJson(
        { code: "rate_limited", error: "Too many reset requests. Please wait before trying again." },
        429,
        { "Retry-After": response.headers.get("retry-after") || "900" }
      );
    }
    if (response.status >= 500 || (!response.ok && ![400, 404].includes(response.status))) {
      return pasuxiJson({ code: "provider_unavailable", error: "Password reset is temporarily unavailable. Please try again later." }, 503);
    }

    // Never reveal whether the address belongs to a Portavero/Supabase account.
    return pasuxiJson({ status: "accepted" });
  } catch {
    return pasuxiJson({ code: "provider_unavailable", error: "Password reset is temporarily unavailable. Please try again later." }, 503);
  }
}
