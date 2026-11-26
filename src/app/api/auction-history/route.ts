import { NextResponse } from "next/server";
import { checkDistributedRateLimit, rateLimitResponseHeaders } from "@/lib/rate-limit.mjs";
import { gaarchieAuqcionisIstoria } from "@/lib/auction-history.mjs";
import { sheamowmeVin } from "@/lib/vin.mjs";

export const runtime = "nodejs";

const auqcionisIstoriisMisamarti = "https://apiauctions.io/api/v1/get-car-vin";

function arisChanaceri(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function servisisRetryHeaders(response: Response): HeadersInit | undefined {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter || !/^[0-9]{1,5}$/.test(retryAfter.trim())) return undefined;
  return { "Retry-After": retryAfter.trim() };
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const rawVin = arisChanaceri(body) && typeof body.vin === "string" ? body.vin : undefined;
  const checked = sheamowmeVin(rawVin);

  if (!checked.valid) {
    return NextResponse.json({ error: checked.message }, { status: 400 });
  }

  const apiToken = process.env.API_AUCTIONS_TOKEN?.trim();
  if (!apiToken) {
    return NextResponse.json({
      error: "Auction-history search is not configured on this deployment yet."
    }, { status: 503 });
  }

  const rateLimit = await checkDistributedRateLimit({
    request,
    scope: "auction-history",
    limit: 8,
    windowSeconds: 3600
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.unavailable
        ? "Auction-history search is temporarily unavailable. Please try again shortly."
        : "Too many auction searches from this connection. Wait before trying again." },
      { status: rateLimit.unavailable ? 503 : 429, headers: rateLimitResponseHeaders(rateLimit) }
    );
  }

  const url = new URL(auqcionisIstoriisMisamarti);
  url.searchParams.set("vin_number", checked.vin);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiToken}`
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        error: "Auction-history access was rejected by the provider. Check that API_AUCTIONS_TOKEN is an active production key."
      }, { status: 503 });
    }

    if (response.status === 402) {
      return NextResponse.json({
        error: "The auction-history provider reports that this API key has no active request allowance or billing package."
      }, { status: 503 });
    }

    if (response.status === 429) {
      return NextResponse.json({
        error: "The auction-history provider rate limit has been reached. Wait before searching again."
      }, {
        status: 429,
        ...(servisisRetryHeaders(response) ? { headers: servisisRetryHeaders(response) } : {})
      });
    }

    // The documented v1 endpoint uses 422 for unknown VINs as well as invalid
    // VIN formats. Never describe this as a clean history or confirmed no-sale.
    if (response.status === 404 || response.status === 422) {
      return NextResponse.json({
        error: "The provider did not return an auction record for this VIN. This does not prove that the vehicle was never listed or sold at auction."
      }, { status: 422 });
    }

    if (!response.ok) {
      return NextResponse.json({
        error: response.status >= 500
          ? "The auction-history provider is temporarily unavailable."
          : "The auction-history request could not be completed."
      }, { status: response.status >= 500 ? 502 : 503 });
    }

    const payload: unknown = await response.json().catch(() => null);
    const parsed = gaarchieAuqcionisIstoria(payload, checked.vin);
    if (!parsed) {
      return NextResponse.json({
        error: "The auction-history provider returned an incomplete, unreadable or mismatched vehicle record. No auction-history result was accepted."
      }, { status: 502 });
    }

    return NextResponse.json({
      ...parsed,
      vin: checked.vin,
      source: "API Auctions",
      sourceUrl: "https://apiauctions.io/docs"
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json({
      error: timedOut
        ? "Auction-history search took too long to respond. Try again."
        : "Could not connect to the auction-history provider."
    }, { status: timedOut ? 504 : 502 });
  }
}
