import { URL } from "node:url";

const ISTORII_CHANACEREBIS_MAQSIMUMI = 30;
const PHOTOEBIS_MAQSIMUMI_CHANACERZE = 24;

function arisChanaceri(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function waikitkheTeqsti(value, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, maxLength);
}

function waikitkheTanxa(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000
    ? Math.round((amount + Number.EPSILON) * 100) / 100
    : null;
}

function waikitkheValuta(value) {
  if (value === null || value === undefined || value === "") return "USD";
  if (typeof value !== "string") return null;
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

function waikitkheGarbeni(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 10_000_000
    ? Math.round(amount)
    : null;
}

function waikitkheGayidvisTarigi(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

function waikitkhePhotoebi(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((photo) => typeof photo === "string" && photo.length <= 2048)
    .map((photo) => {
      try {
        const url = new URL(photo);
        return url.protocol === "https:" ? url.toString() : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, PHOTOEBIS_MAQSIMUMI_CHANACERZE);
}

function gaarchieIstoriisChanaceri(value, index) {
  if (!arisChanaceri(value)) return null;

  const finalBid = waikitkheTanxa(value.final_bid);
  const salePrice = waikitkheTanxa(value.sale_price);
  const price = salePrice ?? finalBid;
  const priceType = salePrice !== null ? "sale-price" : finalBid !== null ? "final-bid" : null;
  const lotNumber = waikitkheTeqsti(value.lot_number, 40);
  const saleDate = waikitkheGayidvisTarigi(value.sale_date ?? value.sold_at);

  return {
    id: [waikitkheTeqsti(value.auction, 40), lotNumber, saleDate ?? "", String(index)].join("-"),
    auction: waikitkheTeqsti(value.auction, 80) || "Auction source not identified",
    lotNumber,
    saleDate,
    saleStatus: waikitkheTeqsti(value.sale_status ?? value.status, 80),
    price,
    priceType,
    priceCurrency: price === null ? null : waikitkheValuta(value.currency),
    odometer: waikitkheGarbeni(value.odometer),
    primaryDamage: waikitkheTeqsti(value.primary_damage ?? value.damage, 120),
    secondaryDamage: waikitkheTeqsti(value.secondary_damage, 120),
    titleType: waikitkheTeqsti(value.title_type ?? value.title, 100),
    location: waikitkheTeqsti(value.location, 120),
    photos: waikitkhePhotoebi(value.photos)
  };
}

/**
 * API Auctions-is zusti VIN-it miRebuli istoriis pasuxebis normalizacia.
 * Mxars uWers dokumentirebul production v1 formats da adreul v3 preview variants.
 * AradamTxveuli VIN an ararsebuli istoriis sia uaryofilia, rom pasuxi arasworad
 * ar aRiqvas rogorc uistorioba.
 * @param {unknown} payload
 * @param {string} expectedVin
 */
export function gaarchieAuqcionisIstoria(payload, expectedVin) {
  if (!arisChanaceri(payload)) return null;

  const vehicleData = payload.result === true && arisChanaceri(payload.data)
    ? payload.data
    : typeof payload.vin === "string"
      ? payload
      : null;

  if (!vehicleData) return null;

  const returnedVin = waikitkheTeqsti(vehicleData.vin, 17).toUpperCase();
  if (!returnedVin || returnedVin !== expectedVin.toUpperCase()) return null;
  if (!Array.isArray(vehicleData.history)) return null;

  const sourceHistory = vehicleData.history;
  const historyTruncated = Boolean(waikitkheTeqsti(vehicleData.next_page, 2048)) ||
    sourceHistory.length > ISTORII_CHANACEREBIS_MAQSIMUMI;
  const visibleHistory = sourceHistory.slice(0, ISTORII_CHANACEREBIS_MAQSIMUMI).map(gaarchieIstoriisChanaceri);
  if (visibleHistory.some((record) => record === null)) return null;
  const history = visibleHistory;

  const yearValue = Number(vehicleData.year);
  const year = Number.isInteger(yearValue) && yearValue >= 1886 && yearValue <= 2100
    ? yearValue
    : null;

  return {
    kind: history.length > 0 ? "found" : "no-history",
    vehicle: {
      vin: returnedVin,
      make: waikitkheTeqsti(vehicleData.make, 100),
      model: waikitkheTeqsti(vehicleData.model, 120),
      year,
      series: waikitkheTeqsti(vehicleData.series, 100),
      trim: waikitkheTeqsti(vehicleData.trim, 100),
      bodyClass: waikitkheTeqsti(vehicleData.body_class, 100)
    },
    history,
    historyTruncated
  };
}

function normalizireSaxeli(value) {
  return waikitkheTeqsti(value, 160).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizireModelisSityvebi(value) {
  const generic = new Set(["CLASS", "SERIES", "MODEL", "SEDAN", "SALOON", "COUPE", "WAGON", "SUV"]);
  return waikitkheTeqsti(value, 160)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((token) => token.length > 1 && !generic.has(token));
}

function manqanisSaxelebiTavsebadia(left, right) {
  const a = normalizireSaxeli(left);
  const b = normalizireSaxeli(right);
  if (!a || !b) return true;
  if (a === b) return true;

  const aTokens = normalizireModelisSityvebi(left);
  const bTokens = new Set(normalizireModelisSityvebi(right));
  return aTokens.some((token) => bTokens.has(token));
}

/**
 * Sheadare gashifruli teqnikuri identoba auqcionis servisis
 * oficialur identobas. Ararsebuli monacemi ar iTvleba uTanxmoebad. Modelis alias-ebs da trim-is
 * dasaxelebebs konfliktis dafiqsirebamde vxedavt.
 * @param {{make?: string, model?: string, modelYear?: number|null, series?: string, trim?: string}|null} decoded
 * @param {{make?: string, model?: string, year?: number|null, series?: string, trim?: string}|null} auction
 * @returns {string[]}
 */
export function sheadareManqanebisIdentoba(decoded, auction) {
  if (!arisChanaceri(decoded) || !arisChanaceri(auction)) return [];

  const mismatches = [];
  const decodedMake = waikitkheTeqsti(decoded.make, 100);
  const auctionMake = waikitkheTeqsti(auction.make, 100);
  if (decodedMake && auctionMake && !manqanisSaxelebiTavsebadia(decodedMake, auctionMake)) {
    mismatches.push(`Make: VIN decoder says ${decodedMake}; auction index says ${auctionMake}`);
  }

  const decodedYear = Number(decoded.modelYear);
  const auctionYear = Number(auction.year);
  if (
    Number.isInteger(decodedYear) && decodedYear >= 1886 &&
    Number.isInteger(auctionYear) && auctionYear >= 1886 &&
    decodedYear !== auctionYear
  ) {
    mismatches.push(`Year: VIN decoder says ${decodedYear}; auction index says ${auctionYear}`);
  }

  const auctionModelNames = [auction.model, auction.series, auction.trim]
    .map((value) => waikitkheTeqsti(value))
    .filter(Boolean);
  const decodedModelNames = [decoded.model, decoded.series, decoded.trim]
    .map((value) => waikitkheTeqsti(value))
    .filter(Boolean);
  if (
    auctionModelNames.length > 0 &&
    decodedModelNames.length > 0 &&
    !auctionModelNames.some((auctionName) =>
      decodedModelNames.some((decodedName) => manqanisSaxelebiTavsebadia(auctionName, decodedName))
    )
  ) {
    mismatches.push(`Model: VIN decoder says ${[decoded.model, decoded.trim].filter(Boolean).join(" ")}; auction index says ${[auction.model, auction.trim].filter(Boolean).join(" ")}`);
  }

  return mismatches;
}
