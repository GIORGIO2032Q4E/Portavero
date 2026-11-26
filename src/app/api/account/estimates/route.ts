import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Momxmarebeli = { id: string };

function migheKonfiguracia() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

function pasuxiJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "Pragma": "no-cache" }
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

async function migheMomxmarebeli(request: NextRequest, config: { url: string; key: string }): Promise<Momxmarebeli | null> {
  const accessToken = request.cookies.get("pvr_access")?.value;
  if (!accessToken) return null;

  const response = await fetch(config.url + "/auth/v1/user", {
    headers: {
      apikey: config.key,
      Authorization: "Bearer " + accessToken,
      Accept: "application/json"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) return null;

  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const id = (payload as Record<string, unknown>).id;
  return typeof id === "string" && id ? { id } : null;
}

async function gaagzavneRestMotxovna(
  request: NextRequest,
  config: { url: string; key: string },
  user: Momxmarebeli,
  method: "GET" | "POST" | "DELETE",
  body?: Record<string, unknown>,
  id?: string
) {
  const url = new URL(config.url + "/rest/v1/saved_estimates");
  if (method === "GET") {
    url.searchParams.set("select", "id,name,data,created_at,updated_at");
    url.searchParams.set("order", "updated_at.desc");
    url.searchParams.set("user_id", "eq." + user.id);
  }
  if (method === "DELETE") {
    url.searchParams.set("id", "eq." + (id ?? ""));
    url.searchParams.set("user_id", "eq." + user.id);
  }

  const response = await fetch(url, {
    method,
    headers: {
      apikey: config.key,
      Authorization: "Bearer " + (request.cookies.get("pvr_access")?.value ?? ""),
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}),
      ...(method === "DELETE" ? { Prefer: "return=representation" } : {})
    },
    ...(body ? { body: JSON.stringify({ ...body, user_id: user.id }) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    return pasuxiJson({ error: "Could not access saved estimates. Please sign in again." }, response.status === 401 ? 401 : 502);
  }

  const payload: unknown = response.status === 204
    ? []
    : await response.json().catch(() => []);
  if (method === "DELETE") {
    return pasuxiJson({ deleted: Array.isArray(payload) && payload.length > 0 });
  }
  return pasuxiJson(payload);
}

export async function GET(request: NextRequest) {
  const config = migheKonfiguracia();
  if (!config) return pasuxiJson({ error: "Account access is not configured." }, 503);
  try {
    const user = await migheMomxmarebeli(request, config);
    if (!user) return pasuxiJson({ error: "Sign in to view saved estimates." }, 401);
    return await gaagzavneRestMotxovna(request, config, user, "GET");
  } catch {
    return pasuxiJson({ error: "Could not load saved estimates. Please try again." }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!igiveOriginia(request)) return pasuxiJson({ error: "This account request was rejected." }, 403);
  const config = migheKonfiguracia();
  if (!config) return pasuxiJson({ error: "Account access is not configured." }, 503);
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return pasuxiJson({ error: "The estimate data is invalid." }, 400);
  }
  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const data = record.data;
  if (!name || name.length > 60 || !data || typeof data !== "object" || Array.isArray(data)) {
    return pasuxiJson({ error: "Estimate names and data must be valid." }, 400);
  }
  if (JSON.stringify(data).length > 100000) {
    return pasuxiJson({ error: "This estimate is too large to save." }, 413);
  }

  try {
    const user = await migheMomxmarebeli(request, config);
    if (!user) return pasuxiJson({ error: "Sign in to save estimates." }, 401);
    return await gaagzavneRestMotxovna(request, config, user, "POST", { name, data });
  } catch {
    return pasuxiJson({ error: "Could not save this estimate. Please try again." }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  if (!igiveOriginia(request)) return pasuxiJson({ error: "This account request was rejected." }, 403);
  const config = migheKonfiguracia();
  if (!config) return pasuxiJson({ error: "Account access is not configured." }, 503);
  const body: unknown = await request.json().catch(() => null);
  const id = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).id
    : null;
  if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(id)) {
    return pasuxiJson({ error: "The saved estimate identifier is invalid." }, 400);
  }

  try {
    const user = await migheMomxmarebeli(request, config);
    if (!user) return pasuxiJson({ error: "Sign in to delete saved estimates." }, 401);
    return await gaagzavneRestMotxovna(request, config, user, "DELETE", undefined, id);
  } catch {
    return pasuxiJson({ error: "Could not delete this estimate. Please try again." }, 503);
  }
}
