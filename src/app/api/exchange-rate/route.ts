import { NextResponse } from "next/server";
import { NBG_USD_KURSIS_MISAMARTI, gaarchieNbgUsdKursi } from "@/lib/nbg-exchange-rate.mjs";

export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch(NBG_USD_KURSIS_MISAMARTI, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "The National Bank exchange rate is temporarily unavailable." },
        { status: 502 }
      );
    }

    const rate = gaarchieNbgUsdKursi(await response.json());
    if (!rate) {
      return NextResponse.json(
        { error: "The National Bank returned an unsupported exchange-rate response." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...rate,
      source: "National Bank of Georgia",
      sourceUrl: "https://nbg.gov.ge/en/monetary-policy/currency"
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the National Bank exchange-rate service." },
      { status: 503 }
    );
  }
}
