"use client";

import { useEffect, useMemo, useState } from "react";
import {
  sheqmeniAshshPotiSheTavazebebi,
  KHARJIS_SHEFASEBIS_WYAROEBI,
  ASHSH_POTIS_SAKONTRO_DIAPAZONEBI
} from "@/lib/cost-estimator.mjs";

type KharjisVelisSakheli = "purchase" | "auction" | "inland" | "shipping" | "insurance" | "port" | "delivery";
type ShippingMethod = "roro" | "sharedContainer" | "ownContainer";
type AuctionPlatform = "copart" | "iaai" | "other";

type Props = {
  currentCosts: Record<KharjisVelisSakheli, number | null>;
  onApply: (field: KharjisVelisSakheli, amount: number) => void;
};

type ExchangeRateResponse = {
  usdToGel?: unknown;
  rateDate?: unknown;
  validFromDate?: unknown;
  error?: unknown;
};

const formatireUsdTanxa = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
}).format(value);

const formatireGelTanxa = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "GEL",
  maximumFractionDigits: 2
}).format(value);

function formatireKursisTarigi(value: string | null) {
  if (!value) return "date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "date unavailable"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function AssistedCostEstimator({ currentCosts, onApply }: Props) {
  const [purchaseBidUsd, setPurchaseBidUsd] = useState<number | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("sharedContainer");
  const [auctionPlatform, setAuctionPlatform] = useState<AuctionPlatform>("copart");
  const [titleType, setTitleType] = useState<"unknown" | "clean" | "nonClean">("unknown");
  const [paymentType, setPaymentType] = useState<"secured" | "unsecured">("secured");
  const [bidType, setBidType] = useState<"preBid" | "live">("live");
  const [pickupAtPoti, setPickupAtPoti] = useState(false);
  const [usdToGel, setUsdToGel] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [validFromDate, setValidFromDate] = useState<string | null>(null);
  const [rateError, setRateError] = useState("");
  const [auctionReference, setAuctionReference] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amount = Number(params.get("auctionBidUsd"));
    if (Number.isFinite(amount) && amount > 0 && amount <= 10_000_000) {
      setPurchaseBidUsd(amount);
      const source = (params.get("auctionSource") ?? "auction").slice(0, 50);
      const date = (params.get("auctionDate") ?? "").slice(0, 10);
      const lot = (params.get("auctionLot") ?? "").slice(0, 40);
      const priceType = params.get("auctionPriceType") === "sale-price" ? "recorded sale price" : "recorded final bid";
      setAuctionReference([
        priceType,
        source,
        date || null,
        lot ? `Lot ${lot}` : null
      ].filter(Boolean).join(" · "));
      if (/iaai/i.test(source)) setAuctionPlatform("iaai");
      else if (/copart/i.test(source)) setAuctionPlatform("copart");
      else setAuctionPlatform("other");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function chaitvirteKursi() {
      try {
        const response = await fetch("/api/exchange-rate", {
          headers: { Accept: "application/json" },
          signal: controller.signal
        });
        const payload = await response.json() as ExchangeRateResponse;
        if (!response.ok || typeof payload.usdToGel !== "number" ||
            !Number.isFinite(payload.usdToGel) || payload.usdToGel <= 0) {
          throw new Error(typeof payload.error === "string" ? payload.error : "The official USD rate is unavailable.");
        }
        setUsdToGel(payload.usdToGel);
        setRateDate(typeof payload.rateDate === "string" ? payload.rateDate : null);
        setValidFromDate(typeof payload.validFromDate === "string" ? payload.validFromDate : null);
        setRateError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setRateError(error instanceof Error ? error.message : "The official USD rate is unavailable.");
      }
    }

    void chaitvirteKursi();
    return () => controller.abort();
  }, []);

  const suggestions = useMemo(() => {
    if (usdToGel === null) return null;
    return sheqmeniAshshPotiSheTavazebebi({
      purchaseUsd: purchaseBidUsd,
      usdToGel,
      shippingMethod,
      titleType,
      paymentType,
      bidType,
      pickupAtPoti,
      auctionPlatform
    });
  }, [usdToGel, purchaseBidUsd, shippingMethod, titleType, paymentType, bidType, pickupAtPoti, auctionPlatform]);

  function asaxeShefaseba(field: KharjisVelisSakheli) {
    if (!suggestions || usdToGel === null) return "Waiting for the official exchange rate";
    if (field === "purchase") {
      return purchaseBidUsd !== null && suggestions.valuesGel.purchase !== null
        ? `${formatireUsdTanxa(purchaseBidUsd)} → ${formatireGelTanxa(suggestions.valuesGel.purchase)}`
        : "Enter the expected winning bid in USD";
    }
    if (field === "auction") {
      const fee = suggestions.valuesUsd.auction;
      if (fee === null) {
        if (auctionPlatform !== "copart") return "No fee table applied for this auction platform";
        return titleType === "unknown" ? "Select a verified title group to calculate" : "Enter a winning bid to calculate";
      }
      return `${formatireUsdTanxa(fee)} → ${formatireGelTanxa(suggestions.valuesGel.auction as number)}`;
    }
    if (field === "delivery") {
      return pickupAtPoti ? "GEL 0 · You collect at Poti" : "Quote required · not estimated";
    }

    const range = suggestions.rangesUsd[field];
    if (!range) return "No reliable benchmark for this selection";
    const lowGel = range.min * usdToGel;
    const highGel = range.max * usdToGel;
    if (range.min === range.max) {
      return `${formatireUsdTanxa(range.min)} → ${formatireGelTanxa(lowGel)}`;
    }
    return `${formatireUsdTanxa(range.min)}–${formatireUsdTanxa(range.max)} · ${formatireGelTanxa(lowGel)}–${formatireGelTanxa(highGel)}`;
  }

  function shetavazebuliMnishvneloba(field: KharjisVelisSakheli) {
    const value = suggestions?.valuesGel[field];
    return typeof value === "number" && Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : null;
  }

  function sheavseCarieliVelebi() {
    const fields: KharjisVelisSakheli[] = ["purchase", "auction", "inland", "shipping", "insurance", "port", "delivery"];
    fields.forEach((field) => {
      const value = shetavazebuliMnishvneloba(field);
      if (currentCosts[field] === null && value !== null) onApply(field, value);
    });
  }

  const xelmisawvdomiSheTavazebebi = (["purchase", "auction", "inland", "shipping", "insurance", "port", "delivery"] as KharjisVelisSakheli[])
    .some((field) => currentCosts[field] === null && shetavazebuliMnishvneloba(field) !== null);

  return (
    <section className="assisted-estimator" aria-labelledby="assisted-estimator-title">
      <div className="assisted-estimator-heading">
        <div>
          <span className="assisted-estimator-kicker">COST ESTIMATE ASSIST</span>
          <h3 id="assisted-estimator-title">Build a starting estimate automatically</h3>
          <p>Current benchmark coverage: USA to Poti. Enter the bid you expect, choose the shipping method and review suggested costs before applying them.</p>
        </div>
        <span className="assisted-estimator-status">Planning estimate, not a quote</span>
      </div>

      <div className="assisted-estimator-controls">
        <div className="field">
          <label htmlFor="assisted-bid-usd">Expected winning bid (USD)</label>
          <input
            id="assisted-bid-usd"
            type="number"
            min="0"
            max="10000000"
            step="50"
            inputMode="decimal"
            placeholder="e.g. 6500"
            value={purchaseBidUsd ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") setPurchaseBidUsd(null);
              else {
                const next = Number(raw);
                setPurchaseBidUsd(Number.isFinite(next) && next >= 0 && next <= 10000000 ? next : null);
              }
            }}
          />
          <small>Enter the price from a listing, an auction-history record or your own bid limit. A historical bid is only a reference, not today's market price.</small>
        </div>
        {auctionReference && (
          <div className="assisted-estimator-history-reference">
            <strong>Historical auction reference loaded</strong>
            <span>{auctionReference}</span>
            <small>This fills the bid input only. It is not added to your import total until you explicitly apply it.</small>
          </div>
        )}
        <div className="field">
          <label htmlFor="assisted-auction-platform">Auction platform</label>
          <select id="assisted-auction-platform" value={auctionPlatform} onChange={(event) => setAuctionPlatform(event.target.value as AuctionPlatform)}>
            <option value="copart">Copart</option>
            <option value="iaai">IAAI</option>
            <option value="other">Other / private seller</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="assisted-shipping-method">Shipping method</label>
          <select id="assisted-shipping-method" value={shippingMethod} onChange={(event) => setShippingMethod(event.target.value as ShippingMethod)}>
            <option value="roro">RoRo</option>
            <option value="sharedContainer">Shared container</option>
            <option value="ownContainer">Full container</option>
          </select>
        </div>
        {auctionPlatform === "copart" && (
          <>
            <div className="field">
              <label htmlFor="assisted-title-type">Copart title group</label>
              <select id="assisted-title-type" value={titleType} onChange={(event) => setTitleType(event.target.value as "unknown" | "clean" | "nonClean")}>
                <option value="unknown">Not confirmed</option>
                <option value="clean">Clean title</option>
                <option value="nonClean">Non-clean / salvage title</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="assisted-payment-type">Copart payment type</label>
              <select id="assisted-payment-type" value={paymentType} onChange={(event) => setPaymentType(event.target.value as "secured" | "unsecured")}>
                <option value="secured">Secured</option>
                <option value="unsecured">Unsecured</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="assisted-bid-type">Bid type</label>
              <select id="assisted-bid-type" value={bidType} onChange={(event) => setBidType(event.target.value as "preBid" | "live")}>
                <option value="preBid">Pre-bid</option>
                <option value="live">Live bid</option>
              </select>
            </div>
          </>
        )}
      </div>

      <label className="assisted-estimator-pickup">
        <input type="checkbox" checked={pickupAtPoti} onChange={(event) => setPickupAtPoti(event.target.checked)} />
        I will collect the vehicle at Poti port
      </label>

      <div className="assisted-estimator-rate" role="status" aria-live="polite">
        {usdToGel !== null
          ? <>1 USD = {usdToGel.toFixed(4)} GEL · NBG official rate · valid from {formatireKursisTarigi(validFromDate ?? rateDate)}</>
          : rateError || "Loading the official USD/GEL rate…"}
        <a href={KHARJIS_SHEFASEBIS_WYAROEBI.exchangeRate} target="_blank" rel="noreferrer">Rate source</a>
      </div>

      <div className="assisted-estimator-results" aria-label="Suggested vehicle import costs">
        <div className="assisted-estimator-row">
          <div><strong>Vehicle purchase</strong><small>Your bid input, converted to GEL</small></div>
          <span>{asaxeShefaseba("purchase")}</span>
          <button type="button" className="button button-light" disabled={shetavazebuliMnishvneloba("purchase") === null} onClick={() => onApply("purchase", shetavazebuliMnishvneloba("purchase") as number)}>Apply</button>
        </div>
        <div className="assisted-estimator-row">
          <div><strong>Auction / buyer fees</strong><small>{auctionPlatform === "copart" ? "Copart buyer + virtual-bid schedule, $95 gate and $15 environmental fees; confirm the lot title group" : "No unsupported auction fee schedule is applied"}</small></div>
          <span>{asaxeShefaseba("auction")}</span>
          <button type="button" className="button button-light" disabled={shetavazebuliMnishvneloba("auction") === null} onClick={() => onApply("auction", shetavazebuliMnishvneloba("auction") as number)}>Apply</button>
        </div>
        <div className="assisted-estimator-row">
          <div><strong>Origin inland transport</strong><small>USA route benchmark range</small></div>
          <span>{asaxeShefaseba("inland")}</span>
          <button type="button" className="button button-light" disabled={shetavazebuliMnishvneloba("inland") === null} onClick={() => onApply("inland", shetavazebuliMnishvneloba("inland") as number)}>Apply midpoint</button>
        </div>
        <div className="assisted-estimator-row">
          <div><strong>International shipping</strong><small>Selected shipping method benchmark range</small></div>
          <span>{asaxeShefaseba("shipping")}</span>
          <button type="button" className="button button-light" disabled={shetavazebuliMnishvneloba("shipping") === null} onClick={() => onApply("shipping", shetavazebuliMnishvneloba("shipping") as number)}>Apply midpoint</button>
        </div>
        <div className="assisted-estimator-row">
          <div><strong>Insurance</strong><small>0.2% planning assumption applied to your bid</small></div>
          <span>{asaxeShefaseba("insurance")}</span>
          <button type="button" className="button button-light" disabled={shetavazebuliMnishvneloba("insurance") === null} onClick={() => onApply("insurance", shetavazebuliMnishvneloba("insurance") as number)}>Apply</button>
        </div>
        <div className="assisted-estimator-row">
          <div><strong>Port handling</strong><small>Shared-container benchmark only</small></div>
          <span>{asaxeShefaseba("port")}</span>
          <button type="button" className="button button-light" disabled={shetavazebuliMnishvneloba("port") === null} onClick={() => onApply("port", shetavazebuliMnishvneloba("port") as number)}>Apply midpoint</button>
        </div>
        <div className="assisted-estimator-row">
          <div><strong>Local delivery / other</strong><small>Local delivery is not priced; pickup at Poti can be set to GEL 0</small></div>
          <span>{asaxeShefaseba("delivery")}</span>
          <button type="button" className="button button-light" disabled={shetavazebuliMnishvneloba("delivery") === null} onClick={() => onApply("delivery", shetavazebuliMnishvneloba("delivery") as number)}>Apply</button>
        </div>
      </div>

      <div className="assisted-estimator-footer">
        <p>
          Logistics ranges are dated benchmarks last checked {ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.lastChecked}. Applying a range uses its midpoint. The standard-car Copart estimate includes the published buyer fee, virtual-bid fee, $95 gate fee and $15 environmental fee. Storage, late-payment, title handling, relist, membership and other conditional charges are excluded. IAAI and other auction fees need a seller quote.
        </p>
        <button type="button" className="button button-dark" disabled={!xelmisawvdomiSheTavazebebi} onClick={sheavseCarieliVelebi}>Fill empty cost fields</button>
      </div>
      <div className="assisted-estimator-sources">
        Sources: <a href={KHARJIS_SHEFASEBIS_WYAROEBI.copart} target="_blank" rel="noreferrer">Copart fee schedule</a> · <a href={KHARJIS_SHEFASEBIS_WYAROEBI.shipping} target="_blank" rel="noreferrer">USA to Georgia shipping guide</a> · <a href={KHARJIS_SHEFASEBIS_WYAROEBI.insurance} target="_blank" rel="noreferrer">Insurance reference</a>
      </div>
    </section>
  );
}
