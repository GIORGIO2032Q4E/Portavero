"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { gamotvaleAmerikuliVinShemowmebisNishna, sheamowmeIaponiuriChassis, sheamowmeVin } from "@/lib/vin.mjs";
import { sheadareManqanebisIdentoba } from "@/lib/auction-history.mjs";
import VinDzebnisShedegi from "./VinDzebnisShedegi";
import { arisAuqcionisIstoriisChanaceri, arisGashifruliVeli } from "./helpers";
import type {
  AuqcionisIstoriisApiPasuxi,
  AuqcionisIstoriisShedegi,
  VinDekodirebisShedegi,
  GashifruliManqana,
  VinDzebnisApiPasuxi
} from "./types";

export default function VinDzebnisGverdi() {
  const [vin, setVin] = useState("");
  const [identifierType, setIdentifierType] = useState<"vin" | "japanese-chassis">("vin");
  const [market, setMarket] = useState<"unknown" | "us">("unknown");
  const [result, setResult] = useState<VinDekodirebisShedegi | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [auctionHistory, setAuctionHistory] = useState<AuqcionisIstoriisShedegi | null>(null);
  const [auctionHistoryLoading, setAuctionHistoryLoading] = useState(false);
  const [auctionHistoryError, setAuctionHistoryError] = useState("");
  const auctionHistoryRequestId = useRef(0);

  const checkedInput = sheamowmeVin(vin);
  const activeValidation = identifierType === "vin" ? checkedInput : sheamowmeIaponiuriChassis(vin);
  const normalizedIdentifierLength = identifierType === "vin"
    ? checkedInput.vin.length
    : sheamowmeIaponiuriChassis(vin).chassis.length;
  const identifierStatus = !vin.trim()
    ? "Waiting for number"
    : activeValidation.valid
      ? "Ready to check"
      : identifierType === "vin"
        ? normalizedIdentifierLength < 17
          ? `${normalizedIdentifierLength} of 17 characters entered`
          : "Check the characters"
        : "Check the CODE-SERIAL format";
  const expectedUsCheckDigit = identifierType === "vin" && market === "us" && checkedInput.valid
    ? gamotvaleAmerikuliVinShemowmebisNishna(checkedInput.vin)
    : null;
  const usCheckDigitMatches = expectedUsCheckDigit !== null &&
    checkedInput.valid &&
    expectedUsCheckDigit === checkedInput.vin[8];
  const auctionIdentityMismatches = result && auctionHistory?.vehicle
    ? sheadareManqanebisIdentoba(result.vehicle, {
        make: auctionHistory.vehicle.make,
        model: auctionHistory.vehicle.model,
        year: auctionHistory.vehicle.year,
        series: auctionHistory.vehicle.series,
        trim: auctionHistory.vehicle.trim
      })
    : [];
  const auctionIdentityIsVerifiable = Boolean(
    result &&
    result.vehicle.make.trim() &&
    result.vehicle.model.trim() &&
    typeof result.vehicle.modelYear === "number" &&
    Number.isInteger(result.vehicle.modelYear) &&
    auctionHistory?.vehicle?.make.trim() &&
    auctionHistory.vehicle.model.trim() &&
    typeof auctionHistory.vehicle.year === "number" &&
    Number.isInteger(auctionHistory.vehicle.year)
  );

  async function gaashifreIdentifikatori(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError("");
    auctionHistoryRequestId.current += 1;
    setAuctionHistory(null);
    setAuctionHistoryError("");
    setAuctionHistoryLoading(false);

    const checked = identifierType === "vin"
      ? sheamowmeVin(vin)
      : sheamowmeIaponiuriChassis(vin);
    if (!checked.valid) {
      setError(checked.message);
      return;
    }
    const identifier = "vin" in checked ? checked.vin : checked.chassis;

    setLoading(true);
    try {
      const response = await fetch("/api/vin-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, identifierType: identifierType === "vin" ? "vin" : "japanese-chassis" })
      });
      const rawPayload: unknown = await response.json();
      const payload: VinDzebnisApiPasuxi = rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
        ? rawPayload as VinDzebnisApiPasuxi
        : {};

      if (
        !response.ok ||
        typeof payload.identifier !== "string" ||
        !payload.vehicle ||
        typeof payload.vehicle !== "object" ||
        Array.isArray(payload.vehicle) ||
        !Array.isArray(payload.fields)
      ) {
        setError(response.ok
          ? "The VIN lookup did not return a usable result. Check the number and try again."
          : typeof payload.error === "string"
            ? payload.error
            : "The VIN could not be checked. Try again.");
        return;
      }

      const fields = payload.fields.filter(arisGashifruliVeli);
      if (fields.length === 0) {
        setError("The lookup did not return any vehicle details for this VIN.");
        return;
      }

      setResult({
        quality: payload.quality === "partial" ? "partial" : "complete",
        identifier: payload.identifier,
        identifierType: payload.identifierType === "japanese-chassis" ? "japanese-chassis" : "vin",
        vehicle: payload.vehicle as GashifruliManqana,
        fields,
        internationalProviderConfigured: payload.internationalProviderConfigured === true,
        internationalLookupStatus: payload.internationalLookupStatus === "matched" ||
          payload.internationalLookupStatus === "no-data" ||
          payload.internationalLookupStatus === "invalid-response" ||
          payload.internationalLookupStatus === "provider-error" ||
          payload.internationalLookupStatus === "not-needed"
          ? payload.internationalLookupStatus
          : "not-configured",
        cardogConfigured: payload.cardogConfigured === true,
        lookupStatus: payload.lookupStatus === "read" ||
          payload.lookupStatus === "ambiguous" ||
          payload.lookupStatus === "serial_unfit"
          ? payload.lookupStatus
          : undefined,
        providerWarnings: Array.isArray(payload.providerWarnings)
          ? payload.providerWarnings.filter((warning): warning is string => typeof warning === "string")
          : [],
        providerMessage: typeof payload.providerMessage === "string" ? payload.providerMessage : undefined,
        sources: Array.isArray(payload.sources)
          ? payload.sources.filter((source): source is string => typeof source === "string")
          : [],
        note: typeof payload.note === "string" ? payload.note : undefined,
      });
    } catch {
      setError("Could not complete the request. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function moidzebneAuqcionisIstoria() {
    if (!result || result.identifierType !== "vin") return;
    const requestId = auctionHistoryRequestId.current + 1;
    auctionHistoryRequestId.current = requestId;
    setAuctionHistory(null);
    setAuctionHistoryError("");
    setAuctionHistoryLoading(true);

    try {
      const response = await fetch("/api/auction-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: result.identifier })
      });
      const rawPayload: unknown = await response.json().catch(() => null);
      if (requestId !== auctionHistoryRequestId.current) return;
      const payload: AuqcionisIstoriisApiPasuxi = rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
        ? rawPayload as AuqcionisIstoriisApiPasuxi
        : {};

      if (!response.ok) {
        setAuctionHistoryError(
          typeof payload.error === "string"
            ? payload.error
            : response.status === 429
              ? "Too many auction searches have been made from this connection. Wait before searching again."
              : "Auction-history search could not be completed. Try again later."
        );
        return;
      }

      const records = Array.isArray(payload.history) ? payload.history : [];
      if (
          payload.vin !== result.identifier ||
          (payload.kind !== "found" && payload.kind !== "no-history") ||
          !Array.isArray(payload.history) ||
          !records.every(arisAuqcionisIstoriisChanaceri) ||
          (payload.kind === "found" && records.length === 0) ||
          (payload.kind === "no-history" && records.length > 0) ||
          (payload.historyTruncated !== undefined && typeof payload.historyTruncated !== "boolean")
      ) {
        setAuctionHistoryError("The auction-history provider returned an unreadable or mismatched result.");
        return;
      }

      const rawVehicle = payload.vehicle && typeof payload.vehicle === "object" && !Array.isArray(payload.vehicle)
        ? payload.vehicle as Record<string, unknown>
        : null;
      const vehicle = rawVehicle && typeof rawVehicle.make === "string" &&
        typeof rawVehicle.model === "string" &&
        (rawVehicle.year === null || (typeof rawVehicle.year === "number" && Number.isInteger(rawVehicle.year)))
        ? {
            make: rawVehicle.make,
            model: rawVehicle.model,
            year: rawVehicle.year as number | null,
            series: typeof rawVehicle.series === "string" ? rawVehicle.series : "",
            trim: typeof rawVehicle.trim === "string" ? rawVehicle.trim : "",
            bodyClass: typeof rawVehicle.bodyClass === "string" ? rawVehicle.bodyClass : ""
          }
        : null;
      if (payload.vehicle !== null && payload.vehicle !== undefined && !vehicle) {
        setAuctionHistoryError("The auction-history provider returned incomplete vehicle identity details. No history result was accepted.");
        return;
      }

      setAuctionHistory({
        kind: payload.kind,
        vin: result.identifier,
        vehicle,
        history: records,
        historyTruncated: payload.historyTruncated === true,
        source: typeof payload.source === "string" ? payload.source : "Auction data provider",
        sourceUrl: typeof payload.sourceUrl === "string" ? payload.sourceUrl : "https://apiauctions.io/docs",
        message: typeof payload.message === "string" ? payload.message : undefined
      });
    } catch {
      if (requestId === auctionHistoryRequestId.current) {
        setAuctionHistoryError("Could not reach the auction-history service. Check your connection and try again.");
      }
    } finally {
      if (requestId === auctionHistoryRequestId.current) setAuctionHistoryLoading(false);
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">VIN check</span>
          <h1>Identify the car. Start the import estimate.</h1>
          <p>Check a standard VIN or a Japanese domestic-market chassis number, then carry the available vehicle details into a Georgia import estimate.</p>
          <div className="hero-actions">
            <Link href="/vehicle-import" className="button button-dark">Enter car details manually ↗</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="tool-layout">
            <section className="panel vehicle-panel">
              <div className="vehicle-section-heading">
                <span className="step-chip">VIN</span>
                <div>
                  <span className="eyebrow">Identify the vehicle</span>
                  <h2>Check its number</h2>
                </div>
              </div>
              <p className="panel-intro">Choose the identifier type shown on the vehicle documents. Portavero sends it only to the matching data source.</p>
              <form onSubmit={gaashifreIdentifikatori}>
                <div className="field">
                  <label htmlFor="identifier-type">Identifier type</label>
                  <select
                    id="identifier-type"
                    value={identifierType}
                    onChange={(event) => {
                      setIdentifierType(event.target.value === "japanese-chassis" ? "japanese-chassis" : "vin");
                      setVin("");
                      setResult(null);
                      setError("");
                    }}
                    disabled={loading}
                  >
                    <option value="vin">Standard 17-character VIN</option>
                    <option value="japanese-chassis">Japanese domestic frame/chassis number</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="vin">{identifierType === "vin" ? "Vehicle identification number (VIN)" : "Japanese frame/chassis number"}</label>
                  <input
                    id="vin"
                    name="vin"
                    type="text"
                    value={vin}
                    onChange={(event) => {
                      setVin(event.target.value.toUpperCase());
                      setResult(null);
                      setError("");
                    }}
                    maxLength={identifierType === "vin" ? 17 : 34}
                    disabled={loading}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder={identifierType === "vin" ? "e.g. 1HGCM82633A004352" : "e.g. ZRR80-0143041"}
                    aria-describedby="identifier-help identifier-status"
                    required
                  />
                  <div className="identifier-assist">
                    {identifierType === "vin" ? (
                      <small id="identifier-help">Enter all 17 characters. Standard VINs do not use I, O or Q.</small>
                    ) : (
                      <small id="identifier-help">Enter the model/frame code and serial number with the hyphen, exactly as shown on the Japanese vehicle plate or export documents.</small>
                    )}
                    <span
                      id="identifier-status"
                      className={activeValidation.valid ? "identifier-status is-ready" : "identifier-status"}
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {identifierType === "vin"
                        ? `${normalizedIdentifierLength}/17${checkedInput.valid ? " · ready" : normalizedIdentifierLength === 17 ? " · check characters" : ""}`
                        : identifierStatus}
                    </span>
                  </div>
                </div>

                {identifierType === "vin" && <div className="field">
                  <label htmlFor="vin-market">Is this a U.S.-market vehicle?</label>
                  <select
                    id="vin-market"
                    value={market}
                    onChange={(event) => setMarket(event.target.value === "us" ? "us" : "unknown")}
                  >
                    <option value="unknown">Not sure / another market</option>
                    <option value="us">Built for the U.S. market</option>
                  </select>
                  <small>Only select this for a car built for the U.S. market. The extra check is not a global VIN rule.</small>
                </div>}

                {expectedUsCheckDigit !== null && (
                  <div className="notice" role="status">
                    {usCheckDigitMatches
                      ? "The U.S. check-digit calculation matches position 9."
                      : `The U.S. check-digit calculation expects "${expectedUsCheckDigit}" in position 9, but the entered VIN has "${checkedInput.valid ? checkedInput.vin[8] : ""}". Check the number against the vehicle and documents.`}
                    {" "}This is a transcription check, not proof that a VIN or vehicle is genuine.
                  </div>
                )}

                <div className="hero-actions">
                  <button type="submit" className="button button-dark lookup-submit" disabled={loading} aria-busy={loading}>
                    {loading && <span className="loading-spinner" aria-hidden="true" />}
                    {loading ? "Checking vehicle…" : identifierType === "vin" ? "Find vehicle details" : "Check chassis number"}
                  </button>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => { setVin(""); setResult(null); setError(""); }}
                    disabled={loading || (!vin && !result && !error)}
                  >
                    Clear
                  </button>
                </div>
              </form>

              {error && (
                <div className="notice" role="alert">
                  <strong>{identifierType === "vin" ? "VIN not decoded." : "Chassis number not decoded."}</strong> {error}
                </div>
              )}

              {result && (
                <VinDzebnisShedegi
                    result={result}
                    auctionHistory={auctionHistory}
                    auctionHistoryLoading={auctionHistoryLoading}
                    auctionHistoryError={auctionHistoryError}
                    auctionIdentityMismatches={auctionIdentityMismatches}
                    auctionIdentityIsVerifiable={auctionIdentityIsVerifiable}
                    onSearchAuctionHistory={moidzebneAuqcionisIstoria}
                  />
              )}
            </section>

            <aside className="panel result-panel vin-limits-panel">
              <span className="eyebrow">What this check can tell you</span>
              <h2>Technical details and optional auction records.</h2>
              <div className="result-lines">
                <div className="result-line">
                  <span>VIN decoding</span>
                  <strong>Shown when available</strong>
                </div>
                <div className="result-line">
                  <span>Accident, title and ownership records</span>
                  <strong>Not searched</strong>
                </div>
                <div className="result-line">
                  <span>Auction records and original photos</span>
                  <strong>Search when available</strong>
                </div>
                <div className="result-line">
                  <span>Odometer / service history</span>
                  <strong>Not available here</strong>
                </div>
              </div>
              <div className="disclaimer">
                Technical VIN decoding and auction-history search are separate. Past Copart, IAAI and Emirates Auction records can be searched on request. Coverage is incomplete, and no indexed result is not proof of a clean history.
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container content-narrow prose">
          <h2>What the lookup can return</h2>
          <p>A standard VIN may return make, model, model year, body type, engine capacity, fuel type, drive type and place of manufacture. A Japanese domestic chassis number can return model-code candidates, possible engines, type approvals and published production information when those records are available.</p>
          <p>The technical VIN decoder itself is not a report of accidents, ownership, title, mileage, servicing or auction history. A separate, user-triggered search can check the provider's retained Copart, IAAI and Emirates Auction records, including recorded prices and currencies, lot details and source photos when available. Portavero compares the provider's vehicle identity against the technical VIN result and only transfers a USD bid reference when both sources provide make, model and year without a detected conflict. Records can be incomplete or unavailable for a VIN. No indexed result does not mean the car was never auctioned or is accident-free.</p>
          <p>Standard VINs and Japanese domestic chassis numbers use different reference sources. Coverage varies by market and manufacturer, so a result may be partial or ambiguous. Neither lookup searches accident, title, ownership, odometer, service or auction history, and neither guarantees that a vehicle has a clean history.</p>
        </div>
      </section>
    </>
  );
}
