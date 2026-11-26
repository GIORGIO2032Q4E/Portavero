import { NextResponse } from "next/server";
import { checkDistributedRateLimit, rateLimitResponseHeaders } from "@/lib/rate-limit.mjs";
import {
  gaertianeVinDecoderisPasuxebi,
  gaarchieCardogisChassisPasuxi,
  gaarchieCarsXeVinPasuxi,
  gaarchieNhtsaVinPasuxi,
  sheamowmeIaponiuriChassis,
  sheamowmeVin
} from "@/lib/vin.mjs";

export const runtime = "nodejs";

const nhtsaMisamarti = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";
const carsXeMisamarti = "https://api.carsxe.com/v1/international-vin-decoder";
const cardogMisamarti = "https://api.cardog.app/v2/chassis";

function arisChanaceri(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function moiTxoveNhtsaDekodireba(vin: string) {
  try {
    const response = await fetch(
      `${nhtsaMisamarti}/${encodeURIComponent(vin)}?format=json`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(12000)
      }
    );

    if (!response.ok) {
      const rateLimited = response.status === 429;
      const unavailable = response.status >= 500;
      const retryAfter = response.headers.get("retry-after");
      return {
        decoded: null,
        failure: {
          status: rateLimited || unavailable ? 503 : 502,
          retryAfter,
          error: rateLimited
            ? "The VIN lookup service is receiving too many requests. Wait a little before trying again."
            : unavailable
              ? "The VIN lookup service is temporarily unavailable."
              : "The VIN could not be checked by the first data source."
        }
      };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        decoded: null,
        failure: {
          status: 502,
          retryAfter: null,
          error: "The first VIN data source returned a response that could not be read."
        }
      };
    }

    return { decoded: gaarchieNhtsaVinPasuxi(payload, vin), failure: null };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      decoded: null,
      failure: {
        status: timedOut ? 504 : 502,
        retryAfter: null,
        error: timedOut
          ? "The first VIN data source took too long to respond."
          : "Could not connect to the first VIN data source."
      }
    };
  }
}

async function moiTxoveCarsXeDekodireba(vin: string, apiKey: string) {
  const url = new URL(carsXeMisamarti);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vin", vin);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) return { decoded: null, status: "provider-error" as const };
    const payload: unknown = await response.json().catch(() => null);
    const decoded = gaarchieCarsXeVinPasuxi(payload, vin);
    if (decoded.result) return { decoded, status: "matched" as const };
    return {
      decoded: null,
      status: decoded.kind === "invalid-response" ? "invalid-response" as const : "no-data" as const
    };
  } catch {
    return { decoded: null, status: "provider-error" as const };
  }
}

async function decodeWithCardog(chassis: string, apiKey: string) {
  try {
    const response = await fetch(`${cardogMisamarti}/${encodeURIComponent(chassis)}`, {
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
        "Cardog-Version": "2026-10-26"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { decoded: null, status: 422, error: "No Japanese chassis record was found. Check the model code and serial against the vehicle plate and export documents." };
      }
      if (response.status === 400) {
        return { decoded: null, status: 400, error: "The chassis number format was not accepted. Enter it exactly as shown on the vehicle plate or export documents." };
      }
      if ([401, 402, 403].includes(response.status)) {
        return { decoded: null, status: 503, error: "The Japanese chassis lookup is unavailable with the configured provider key or credit allowance." };
      }
      if (response.status === 429) {
        return { decoded: null, status: 503, error: "The Japanese chassis lookup has reached its request limit. Try again later." };
      }
      return { decoded: null, status: 502, error: "The Japanese chassis data source is temporarily unavailable." };
    }

    const payload: unknown = await response.json().catch(() => null);
    const decoded = gaarchieCardogisChassisPasuxi(payload, chassis);
    if (!decoded.result) {
      return {
        decoded: null,
        status: decoded.kind === "invalid-response" ? 502 : 422,
        error: decoded.kind === "invalid-response"
          ? "The Japanese chassis data source returned an unreadable response."
          : "No matching Japanese chassis details were found. Check the number against the vehicle documents."
      };
    }
    return { decoded, status: 200, error: null };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      decoded: null,
      status: timedOut ? 504 : 502,
      error: timedOut
        ? "The Japanese chassis lookup took too long to respond."
        : "Could not connect to the Japanese chassis data source."
    };
  }
}

function needsInternationalLookup(decoded: { kind?: string; result?: { vehicle?: Record<string, unknown> } } | null) {
  if (!decoded?.result?.vehicle) return true;
  const vehicle = decoded.result.vehicle;
  const fuelValues = [
    vehicle.primaryFuelType,
    vehicle.secondaryFuelType,
    vehicle.electrificationLevel
  ];
  const hasUsefulFuelData = fuelValues.some((value) =>
    typeof value === "string" &&
    value.trim() !== "" &&
    !/^(?:unknown|not known|not available|not reported|not applicable|n\/?a|none)$/i.test(value.trim())
  );

  return decoded.kind !== "complete" ||
    !vehicle.make ||
    !vehicle.model ||
    !vehicle.modelYear ||
    (!vehicle.engineCc && vehicle.isElectric !== true) ||
    (!hasUsefulFuelData && vehicle.isElectric !== true && vehicle.isHybrid !== true);
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const rawIdentifier = arisChanaceri(body)
    ? (typeof body.identifier === "string" ? body.identifier : body.vin)
    : undefined;
  const identifierType = arisChanaceri(body) && body.identifierType === "japanese-chassis"
    ? "japanese-chassis"
    : "vin";

  if (identifierType === "japanese-chassis") {
    const checked = sheamowmeIaponiuriChassis(rawIdentifier);
    if (!checked.valid) {
      return NextResponse.json({ error: checked.message }, { status: 400 });
    }

    const rateLimit = await checkDistributedRateLimit({
      request,
      scope: "vin:japanese-chassis",
      limit: 20,
      windowSeconds: 3600
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.unavailable
          ? "Vehicle lookup is temporarily unavailable. Please try again shortly."
          : "Too many chassis lookups from this connection. Wait before trying again." },
        { status: rateLimit.unavailable ? 503 : 429, headers: rateLimitResponseHeaders(rateLimit) }
      );
    }

    const cardogApiKey = process.env.CARDOG_API_KEY?.trim();
    if (!cardogApiKey) {
      return NextResponse.json({
        error: "Japanese chassis lookup is not configured yet. Add a private CARDOG_API_KEY to enable it, or enter the car details manually."
      }, { status: 503 });
    }

    const lookup = await decodeWithCardog(checked.chassis, cardogApiKey);
    if (!lookup.decoded?.result) {
      return NextResponse.json({ error: lookup.error }, { status: lookup.status });
    }

    return NextResponse.json({
      ...lookup.decoded.result,
      identifier: lookup.decoded.result.chassis,
      identifierType: "japanese-chassis",
      lookupStatus: lookup.decoded.status,
      cardogConfigured: true
    });
  }

  const checked = sheamowmeVin(rawIdentifier);
  if (!checked.valid) {
    return NextResponse.json({ error: checked.message }, { status: 400 });
  }

  const rateLimit = await checkDistributedRateLimit({
    request,
    scope: "vin:standard",
    limit: 40,
    windowSeconds: 3600
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.unavailable
        ? "Vehicle lookup is temporarily unavailable. Please try again shortly."
        : "Too many VIN lookups from this connection. Wait before trying again." },
      { status: rateLimit.unavailable ? 503 : 429, headers: rateLimitResponseHeaders(rateLimit) }
    );
  }

  const nhtsa = await moiTxoveNhtsaDekodireba(checked.vin);
  let decoded = nhtsa.decoded;
  const carsXeApiKey = process.env.CARSXE_API_KEY?.trim();
  const internationalProviderConfigured = Boolean(carsXeApiKey);
  let internationalLookupStatus: "not-configured" | "not-needed" | "matched" | "no-data" | "invalid-response" | "provider-error" =
    carsXeApiKey ? "not-needed" : "not-configured";

  if (carsXeApiKey && needsInternationalLookup(decoded)) {
    const international = await moiTxoveCarsXeDekodireba(checked.vin, carsXeApiKey);
    internationalLookupStatus = international.status;
    if (international.decoded) {
      decoded = gaertianeVinDecoderisPasuxebi(decoded, international.decoded) as typeof decoded;
    }
  }

  if (!decoded?.result) {
    if (nhtsa.failure) {
      return NextResponse.json(
        { error: nhtsa.failure.error, internationalProviderConfigured, internationalLookupStatus },
        {
          status: nhtsa.failure.status,
          ...(nhtsa.failure.retryAfter
            ? { headers: { "Retry-After": nhtsa.failure.retryAfter } }
            : {})
        }
      );
    }

    if (decoded?.kind === "invalid-response") {
      return NextResponse.json(
        { error: "The VIN lookup returned an unexpected response. Please try again later.", internationalProviderConfigured, internationalLookupStatus },
        { status: 502 }
      );
    }

    const error = decoded?.kind === "no-result"
      ? "The available VIN decoders returned no result. Check the VIN and the vehicle documents."
      : "No technical vehicle details were found by the available VIN decoders. Some Japanese domestic-market vehicles use a chassis number instead of a 17-character VIN; select the Japanese chassis-number option to check one when that lookup is configured.";
    return NextResponse.json({ error, internationalProviderConfigured, internationalLookupStatus }, { status: 422 });
  }

  return NextResponse.json({
    ...decoded.result,
    identifier: checked.vin,
    identifierType: "vin",
    internationalProviderConfigured,
    internationalLookupStatus
  });
}
