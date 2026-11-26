import type { AuqcionisIstoriisChanaceri, AuqcionisFasisReferencia, VinDekodirebisShedegi, GashifruliVeli } from "./types";

export function arisGashifruliVeli(value: unknown): value is GashifruliVeli {
  return Boolean(value) &&
    typeof value === "object" &&
    typeof (value as GashifruliVeli).label === "string" &&
    typeof (value as GashifruliVeli).value === "string";
}

export function arisAuqcionisIstoriisChanaceri(value: unknown): value is AuqcionisIstoriisChanaceri {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const validPrice = item.price === null ||
    (typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0);
  const validPriceType = item.priceType === null ||
    item.priceType === "sale-price" ||
    item.priceType === "final-bid";
  const validDate = item.saleDate === null ||
    (typeof item.saleDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.saleDate));
  const validCurrency = item.priceCurrency === null ||
    (typeof item.priceCurrency === "string" && /^[A-Z]{3}$/.test(item.priceCurrency));
  return typeof item.id === "string" &&
    typeof item.auction === "string" &&
    typeof item.lotNumber === "string" &&
    validDate &&
    (typeof item.saleStatus === "string") &&
    validPrice &&
    validPriceType &&
    validCurrency &&
    (item.odometer === null || (typeof item.odometer === "number" && Number.isFinite(item.odometer))) &&
    typeof item.primaryDamage === "string" &&
    typeof item.secondaryDamage === "string" &&
    typeof item.titleType === "string" &&
    typeof item.location === "string" &&
    Array.isArray(item.photos) &&
    item.photos.every((photo) => typeof photo === "string" && photo.startsWith("https://"));
}

export function formatireAuqcionisFasi(value: number, currency: string | null) {
  if (!currency || !/^[A-Z]{3}$/.test(currency)) {
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} (currency not identified)`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
}

export function importisShefasebisMisamarti(result: VinDekodirebisShedegi, auctionReference?: AuqcionisFasisReferencia) {
  const vehicle = result.vehicle;
  const params = new URLSearchParams();
  if (result.identifierType === "vin") params.set("vin", result.identifier);
  else params.set("chassis", result.identifier);

  if (vehicle.make) params.set("make", vehicle.make);
  if (vehicle.model) params.set("model", vehicle.model);
  if (vehicle.modelYear) params.set("year", String(vehicle.modelYear));
  if (vehicle.engineCc !== null) params.set("engineCc", String(vehicle.engineCc));
  if (vehicle.primaryFuelType) params.set("fuelPrimary", vehicle.primaryFuelType);
  if (vehicle.secondaryFuelType) params.set("fuelSecondary", vehicle.secondaryFuelType);
  if (vehicle.electrificationLevel) params.set("electrification", vehicle.electrificationLevel);
  if (vehicle.steering) params.set("steering", vehicle.steering);
  if (vehicle.series) params.set("series", vehicle.series);
  if (vehicle.trim) params.set("trim", vehicle.trim);
  if (auctionReference) {
    params.set("auctionBidUsd", String(auctionReference.price));
    params.set("auctionSource", auctionReference.auction);
    if (auctionReference.date) params.set("auctionDate", auctionReference.date);
    if (auctionReference.lotNumber) params.set("auctionLot", auctionReference.lotNumber);
    if (auctionReference.priceType) params.set("auctionPriceType", auctionReference.priceType);
  }

  return `/vehicle-import?${params.toString()}`;
}
