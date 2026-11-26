import Link from "next/link";
import { formatireAuqcionisFasi, importisShefasebisMisamarti } from "./helpers";
import type { AuqcionisIstoriisShedegi, VinDekodirebisShedegi } from "./types";

type Props = {
  result: VinDekodirebisShedegi;
  auctionHistory: AuqcionisIstoriisShedegi | null;
  auctionHistoryLoading: boolean;
  auctionHistoryError: string;
  auctionIdentityMismatches: string[];
  auctionIdentityIsVerifiable: boolean;
  onSearchAuctionHistory: () => void;
};

export default function VinDzebnisShedegi({
  result,
  auctionHistory,
  auctionHistoryLoading,
  auctionHistoryError,
  auctionIdentityMismatches,
  auctionIdentityIsVerifiable,
  onSearchAuctionHistory
}: Props) {
  return (
    <div className="vin-result" aria-live="polite">
                      <div className="notice" role="status">
                        {result.identifierType === "japanese-chassis"
                          ? result.lookupStatus === "ambiguous"
                            ? <><strong>This chassis code matches more than one maker.</strong> Review the possible matches below and confirm the full frame number against the vehicle plate.</>
                            : result.lookupStatus === "serial_unfit"
                              ? <><strong>The chassis code is recognized, but the serial does not fit a known production range.</strong> Check the serial against the vehicle plate and export documents. No exact vehicle has been identified.</>
                              : <><strong>Japanese chassis details found.</strong> The registry may list several models or engine variants. Confirm the exact car and manufacture year from its documents.</>
                          : result.quality === "complete"
                            ? <><strong>Vehicle details found.</strong> Compare them with the car and its documents before using the estimate.</>
                            : <><strong>Only some details were found.</strong> Some vehicle specifications may be missing. Check the information below against the car's documents.</>}
                      </div>
                      {result.identifierType === "vin" && !result.internationalProviderConfigured && <div className="notice" role="status"><strong>International VIN fallback is not configured.</strong> This lookup uses NHTSA data only, so some non-U.S. vehicle details may be incomplete.</div>}
                      {result.identifierType === "vin" && result.internationalLookupStatus === "no-data" && <div className="notice" role="status"><strong>No additional international details were returned.</strong> The available NHTSA information is retained; missing specifications remain blank.</div>}
                      {result.identifierType === "vin" && result.internationalLookupStatus === "invalid-response" && <div className="notice" role="status"><strong>The international data source returned an unexpected response.</strong> NHTSA information is retained and unverified fields remain blank.</div>}
                      {result.identifierType === "vin" && result.internationalLookupStatus === "provider-error" && <div className="notice" role="status"><strong>The international data source could not complete this lookup.</strong> NHTSA information is retained. Try again later if important details are missing.</div>}
                      {result.providerWarnings.length > 0 && <div className="notice" role="alert"><strong>VIN decoder warnings</strong><ul>{result.providerWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
                      {result.providerMessage && <p className="source-note">Provider message: {result.providerMessage}</p>}
                      {result.sources.length > 0 && <p className="source-note">Data source{result.sources.length === 1 ? "" : "s"}: {result.sources.join(", ")}</p>}
                      {result.note && <p className="source-note">{result.note}</p>}
                      <div className="vin-result-heading">
                        <h3>{[result.vehicle.make, result.vehicle.model, result.vehicle.modelYear].filter(Boolean).join(" ") || "Vehicle details found"}</h3>
                        <p>{result.identifierType === "japanese-chassis" ? "Available details linked to this frame number" : "Available technical details linked to this VIN"}</p>
                      </div>
                      <div className="result-lines">
                        {result.fields.map((field) => (
                          <div className="result-line" key={field.label}>
                            <span>{field.label}</span>
                            <strong>{field.value}</strong>
                          </div>
                        ))}
                      </div>
                      {result.identifierType === "vin" ? (
                        <p className="source-note">Coverage varies by vehicle market and the records available for that VIN. Some non-U.S. vehicles may return fewer details. Check every result against the car and its documents.</p>
                      ) : (
                        <p className="source-note">Japanese chassis records can list possible models and engine variants rather than one exact vehicle configuration. Confirm the model, engine and manufacture year from the vehicle documents.</p>
                      )}
                      <p className="source-note">Identifier submitted: <code>{result.identifier}</code></p>
                      <p className="source-note">The calculator carries over only unambiguous make, model and engine details. Manufacture year, steering side and any uncertain engine variant must be confirmed from the vehicle documents.</p>
                      <div className="auction-history-panel">
                        <div className="auction-history-panel-heading">
                          <div>
                            <span className="auction-history-kicker">OPTIONAL AUCTION SEARCH</span>
                            <h4>Find previous auction sales</h4>
                            <p>Search the provider index for recorded Copart, IAAI and Emirates Auction events linked to this exact VIN. Coverage varies by market and VIN.</p>
                          </div>
                          <button
                            type="button"
                            className="button button-outline"
                            onClick={onSearchAuctionHistory}
                            disabled={auctionHistoryLoading}
                            aria-busy={auctionHistoryLoading}
                          >
                            {auctionHistoryLoading && <span className="loading-spinner" aria-hidden="true" />}
                            {auctionHistoryLoading ? "Searching auctions…" : auctionHistory ? "Search again" : "Search auction history"}
                          </button>
                        </div>
                        {auctionHistoryError && <div className="notice" role="alert">{auctionHistoryError}</div>}
                        {auctionHistory?.kind === "no-history" && (
                          <div className="notice" role="status">
                            <strong>No indexed auction record found.</strong> The provider does not currently have a retained auction event for this VIN. This does not prove the car was never listed, sold or damaged.
                          </div>
                        )}
                        {auctionHistory?.vehicle && (
                          <div className="auction-history-provider-identity">
                            <strong>Vehicle identity returned by auction provider</strong>
                            <span>
                              {[auctionHistory.vehicle.make, auctionHistory.vehicle.model, auctionHistory.vehicle.year].filter(Boolean).join(" ") || "Identity details incomplete"}
                            </span>
                          </div>
                        )}
                        {auctionIdentityMismatches.length > 0 && (
                          <div className="notice" role="alert">
                            <strong>Vehicle identity conflict. Do not use these prices as a bid reference.</strong>
                            <ul>
                              {auctionIdentityMismatches.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                            Check the VIN and original auction lot before relying on this record.
                          </div>
                        )}
                        {auctionHistory?.kind === "found" && auctionIdentityMismatches.length === 0 && !auctionIdentityIsVerifiable && (
                          <div className="notice" role="status">
                            <strong>Vehicle identity could not be fully verified.</strong> One or both sources are missing the make, model or year needed for a safe comparison. Auction prices are shown for review, but cannot be transferred into the calculator.
                          </div>
                        )}
                        {auctionHistory?.kind === "found" && (
                          <div className="auction-history-list">
                            <div className="auction-history-summary">
                              <strong>{auctionHistory.history.length} recorded auction {auctionHistory.history.length === 1 ? "event" : "events"}</strong>
                              <a href={auctionHistory.sourceUrl} target="_blank" rel="noreferrer">Provider documentation: {auctionHistory.source ?? "Auction data provider"}</a>
                            </div>
                            {auctionHistory.history.map((record) => (
                              <article className="auction-history-card" key={record.id}>
                                <div className="auction-history-card-top">
                                  <div>
                                    <strong>{record.auction}</strong>
                                    <small>{record.lotNumber ? `Lot ${record.lotNumber}` : "Lot number not provided"}</small>
                                  </div>
                                  <div className="auction-history-price">
                                    <strong>{record.price !== null ? formatireAuqcionisFasi(record.price, record.priceCurrency) : "Price not recorded"}</strong>
                                    <small>{record.priceType === "sale-price" ? "Recorded sale price" : record.priceType === "final-bid" ? "Recorded final bid" : "No price in source record"}{record.price !== null && record.priceCurrency ? ` · ${record.priceCurrency}` : ""}</small>
                                  </div>
                                </div>
                                <div className="auction-history-card-meta">
                                  <span>{record.saleDate ?? "Sale date not provided"}</span>
                                  <span>{record.saleStatus || "Status not provided"}</span>
                                  {record.odometer !== null && <span>{record.odometer.toLocaleString("en-US")} · odometer as reported</span>}
                                  {record.titleType && <span>{record.titleType} title</span>}
                                  {record.location && <span>{record.location}</span>}
                                  {record.primaryDamage && <span>Primary damage: {record.primaryDamage}</span>}
                                  {record.secondaryDamage && <span>Secondary damage: {record.secondaryDamage}</span>}
                                </div>
                                <div className="auction-history-card-actions">
                                  {record.price !== null && record.price > 0 && record.priceCurrency === "USD" && auctionIdentityMismatches.length === 0 && auctionIdentityIsVerifiable && (
                                    <Link
                                      href={importisShefasebisMisamarti(result, {
                                        price: record.price,
                                        auction: record.auction,
                                        date: record.saleDate,
                                        lotNumber: record.lotNumber,
                                        priceType: record.priceType
                                      })}
                                      className="button button-dark button-small"
                                    >
                                      Use as bid reference ↗
                                    </Link>
                                  )}
                                  {record.price !== null && record.price > 0 && record.priceCurrency !== "USD" && (
                                    <span className="auction-history-currency-note">This price is in {record.priceCurrency || "an unknown currency"}. Only USD amounts can be transferred into the USD bid field.</span>
                                  )}
                                  {record.price !== null && record.price > 0 && record.priceCurrency === "USD" && auctionIdentityMismatches.length === 0 && !auctionIdentityIsVerifiable && (
                                    <span className="auction-history-currency-note">The vehicle identity is incomplete, so this price cannot be transferred into the calculator.</span>
                                  )}
                                  {record.photos.map((photo, photoIndex) => (
                                    <a
                                      href={photo}
                                      key={photo}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="auction-history-photo-link"
                                    >
                                      Photo {photoIndex + 1} ↗
                                    </a>
                                  ))}
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                        {auctionHistory?.historyTruncated && (
                          <div className="notice" role="status">
                            The provider returned a cursor for more auction events. Portavero is showing only the first response page, so this list may be incomplete.
                          </div>
                        )}
                        <p className="auction-history-disclaimer">
                          Auction records are third-party data and may be incomplete or mismatched. Verify the provider's vehicle identity, original lot, sale status, currency and date before relying on a price. A final bid is not always proof of a completed sale. No indexed result is not a clean-history report.
                        </p>
                      </div>
                      <Link href={importisShefasebisMisamarti(result)} className="button button-dark">Use these details in the import estimate ↗</Link>
                    </div>
  );
}
