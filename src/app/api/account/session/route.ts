import { NextRequest, NextResponse } from "next/server";
import { checkDistributedRateLimit, rateLimitResponseHeaders } from "@/lib/rate-limit.mjs";
import { angarisheEmailValiduria, normalizireAngarishisEmail } from "@/lib/account-validation.mjs";

export const runtime = "nodejs";

const sesiaAccessCookie = "pvr_access";
const sesiaRefreshCookie = "pvr_refresh";
const ganaxlebisCookieMaxAsaki = 60 * 60 * 24 * 30;

type SupabaseMomxmarebeli = { id: string; email?: string };

function migheKonfiguracia() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

function arisChanaceri(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function usafrtxoMomxmarebeli(value: unknown): SupabaseMomxmarebeli | null {
  if (!arisChanaceri(value) || typeof value.id !== "string" || !value.id) return null;
  return { id: value.id, ...(typeof value.email === "string" ? { email: value.email } : {}) };
}

function amoiReSesia(value: unknown) {
  if (!arisChanaceri(value)) return null;
  const user = usafrtxoMomxmarebeli(value.user);
  if (
    typeof value.access_token !== "string" || !value.access_token ||
    typeof value.refresh_token !== "string" || !value.refresh_token ||
    !user
  ) return null;

  const expiresIn = typeof value.expires_in === "number" &&
    Number.isFinite(value.expires_in) && value.expires_in > 0
    ? Math.min(Math.floor(value.expires_in), 60 * 60 * 24 * 7)
    : 3600;
  return {
    accessToken: value.access_token,
    refreshToken: value.refresh_token,
    expiresIn,
    user
  };
}

function daayeneSesiisCookieebi(response: NextResponse, session: NonNullable<ReturnType<typeof amoiReSesia>>) {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/"
  };
  response.cookies.set(sesiaAccessCookie, session.accessToken, { ...common, maxAge: session.expiresIn });
  response.cookies.set(sesiaRefreshCookie, session.refreshToken, { ...common, maxAge: ganaxlebisCookieMaxAsaki });
}

function washaleSesiisCookieebi(response: NextResponse) {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0
  };
  response.cookies.set(sesiaAccessCookie, "", common);
  response.cookies.set(sesiaRefreshCookie, "", common);
}

function pasuxiJson(body: Record<string, unknown>, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache", ...extraHeaders }
  });
}

function igiveOriginia(request: NextRequest) {
  const originHeader = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!originHeader || !host) return false;

  try {
    const origin = new URL(originHeader);
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const requestProtocol = forwardedProtocol
      ? `${forwardedProtocol}:`
      : new URL(request.url).protocol;
    return origin.host.toLowerCase() === host.toLowerCase() && origin.protocol === requestProtocol;
  } catch {
    return false;
  }
}

async function gaagzavneSupabaseMotxovna(
  config: { url: string; key: string },
  path: string,
  init: RequestInit = {}
) {
  return fetch(config.url + path, {
    ...init,
    headers: { apikey: config.key, Accept: "application/json", ...init.headers },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(12000)
  });
}

async function waikitkheMomxmarebeli(config: { url: string; key: string }, accessToken: string) {
  const response = await gaagzavneSupabaseMotxovna(config, "/auth/v1/user", {
    headers: { Authorization: "Bearer " + accessToken }
  });
  const payload: unknown = await response.json().catch(() => null);
  return { response, user: usafrtxoMomxmarebeli(payload) };
}

function providerMessage(payload: unknown, status: number) {
  if (status === 400 || status === 401) {
    return "The email or password is incorrect, or the recovery link has expired.";
  }
  if (arisChanaceri(payload)) {
    const message = typeof payload.msg === "string" ? payload.msg
      : typeof payload.message === "string" ? payload.message
      : typeof payload.error_description === "string" ? payload.error_description
      : null;
    if (message && message.length < 220) return message;
  }
  return "The account request could not be completed. Please try again.";
}

export async function GET(request: NextRequest) {
  const config = migheKonfiguracia();
  if (!config) return pasuxiJson({ error: "Account access is not configured." }, 503);

  const accessToken = request.cookies.get(sesiaAccessCookie)?.value;
  const refreshToken = request.cookies.get(sesiaRefreshCookie)?.value;
  if (!accessToken) return pasuxiJson({ session: null });

  try {
    const current = await waikitkheMomxmarebeli(config, accessToken);
    if (current.response.ok && current.user) {
      return pasuxiJson({ session: { user: current.user } });
    }
    if (current.response.status !== 401 && current.response.status !== 403) {
      return pasuxiJson({ error: "Could not verify the account session. Please try again." }, 503);
    }
    if (!refreshToken) {
      const response = pasuxiJson({ session: null });
      washaleSesiisCookieebi(response);
      return response;
    }

    const refreshResponse = await gaagzavneSupabaseMotxovna(config, "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    const refreshedPayload: unknown = await refreshResponse.json().catch(() => null);
    const refreshed = refreshResponse.ok ? amoiReSesia(refreshedPayload) : null;
    if (refreshed) {
      const response = pasuxiJson({ session: { user: refreshed.user } });
      daayeneSesiisCookieebi(response, refreshed);
      return response;
    }
    if ([400, 401, 403].includes(refreshResponse.status)) {
      const response = pasuxiJson({ session: null });
      washaleSesiisCookieebi(response);
      return response;
    }
    return pasuxiJson({ error: "Could not refresh the account session. Please try again." }, 503);
  } catch {
    return pasuxiJson({ error: "Could not verify the account session. Please try again." }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!igiveOriginia(request)) return pasuxiJson({ error: "This account request was rejected." }, 403);
  const config = migheKonfiguracia();
  if (!config) return pasuxiJson({ error: "Account access is not configured." }, 503);

  const body: unknown = await request.json().catch(() => null);
  if (!arisChanaceri(body) || typeof body.action !== "string") {
    return pasuxiJson({ error: "The account request is invalid." }, 400);
  }

  const action = body.action;
  if (action === "signout") {
    const accessToken = request.cookies.get(sesiaAccessCookie)?.value;
    if (accessToken) {
      try {
        await gaagzavneSupabaseMotxovna(config, "/auth/v1/logout", {
          method: "POST",
          headers: { Authorization: "Bearer " + accessToken }
        });
      } catch {
        // Cookies are cleared even if the remote revoke endpoint is unavailable.
      }
    }
    const response = pasuxiJson({ signedOut: true });
    washaleSesiisCookieebi(response);
    return response;
  }

  if (action === "update-password") {
    const password = typeof body.password === "string" ? body.password : "";
    const accessToken = request.cookies.get(sesiaAccessCookie)?.value;
    if (!accessToken) return pasuxiJson({ error: "Your recovery session has expired. Request a new reset link." }, 401);
    if (password.length < 8 || password.length > 128) {
      return pasuxiJson({ error: "Use a password between 8 and 128 characters." }, 400);
    }
    try {
      const response = await gaagzavneSupabaseMotxovna(config, "/auth/v1/user", {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        return pasuxiJson({ error: providerMessage(payload, response.status) }, response.status === 401 ? 401 : 502);
      }
      return pasuxiJson({ updated: true });
    } catch {
      return pasuxiJson({ error: "Could not update the password. Please try again." }, 502);
    }
  }

  if (action === "recovery") {
    const accessToken = typeof body.access_token === "string" ? body.access_token : "";
    const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token : "";
    const expiresIn = typeof body.expires_in === "number" &&
      Number.isFinite(body.expires_in) && body.expires_in > 0
      ? Math.min(Math.floor(body.expires_in), 60 * 60 * 24 * 7)
      : 3600;
    if (!accessToken || !refreshToken) {
      return pasuxiJson({ error: "The recovery link is incomplete. Request a new one." }, 400);
    }
    try {
      const checked = await waikitkheMomxmarebeli(config, accessToken);
      if (!checked.response.ok || !checked.user) {
        return pasuxiJson({ error: "The recovery link has expired. Request a new password reset link." }, 401);
      }
      const session = { accessToken, refreshToken, expiresIn, user: checked.user };
      const response = pasuxiJson({ session: { user: checked.user } });
      daayeneSesiisCookieebi(response, session);
      return response;
    } catch {
      return pasuxiJson({ error: "Could not verify the recovery link. Please try again." }, 503);
    }
  }

  if (action !== "signin" && action !== "signup") {
    return pasuxiJson({ error: "The account action is not supported." }, 400);
  }

  const email = normalizireAngarishisEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!angarisheEmailValiduria(email)) {
    return pasuxiJson({ error: "Enter a valid email address." }, 400);
  }
  if (password.length < 8 || password.length > 128) {
    return pasuxiJson({ error: "Use a password between 8 and 128 characters." }, 400);
  }

  const rateLimit = await checkDistributedRateLimit({
    request,
    scope: action === "signup" ? "account:signup" : "account:signin",
    limit: action === "signup" ? 5 : 20,
    windowSeconds: 3600
  });
  if (!rateLimit.allowed) {
    return pasuxiJson(
      { error: rateLimit.unavailable
        ? "Account access is temporarily unavailable. Please try again shortly."
        : "Too many account attempts from this connection. Wait before trying again." },
      rateLimit.unavailable ? 503 : 429,
      rateLimitResponseHeaders(rateLimit)
    );
  }

  const authPath = action === "signin"
    ? "/auth/v1/token?grant_type=password"
    : "/auth/v1/signup?redirect_to=" + encodeURIComponent(new URL("/account", request.url).toString());

  try {
    const response = await gaagzavneSupabaseMotxovna(config, authPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      return pasuxiJson({ error: providerMessage(payload, response.status) }, response.status === 429 ? 429 : 400);
    }

    const session = amoiReSesia(payload);
    const rawUser = arisChanaceri(payload) ? usafrtxoMomxmarebeli(payload.user) : null;
    if (session) {
      const response = pasuxiJson({ session: { user: session.user }, user: session.user });
      daayeneSesiisCookieebi(response, session);
      return response;
    }
    return pasuxiJson({ session: null, user: rawUser });
  } catch {
    return pasuxiJson({ error: "Could not reach the account service. Please try again." }, 503);
  }
}
