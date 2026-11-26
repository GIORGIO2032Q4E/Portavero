export type GashifruliVeli = { label: string; value: string };
export type GashifruliManqana = {
  make: string;
  model: string;
  modelYear: number | null;
  engineCc: number | null;
  primaryFuelType: string;
  secondaryFuelType: string;
  electrificationLevel: string;
  steeringLocation: string;
  steering: "" | "left" | "right";
  isElectric: boolean;
  isHybrid: boolean;
  isPlugInHybrid: boolean;
  series: string;
  trim: string;
};
export type VinDekodirebisShedegi = {
  quality: "complete" | "partial";
  identifier: string;
  identifierType: "vin" | "japanese-chassis";
  vehicle: GashifruliManqana;
  fields: GashifruliVeli[];
  internationalProviderConfigured: boolean;
  internationalLookupStatus: "not-configured" | "not-needed" | "matched" | "no-data" | "invalid-response" | "provider-error";
  cardogConfigured: boolean;
  lookupStatus?: "read" | "ambiguous" | "serial_unfit";
  providerWarnings: string[];
  providerMessage?: string;
  sources: string[];
  note?: string;
};
export type AuqcionisIstoriisChanaceri = {
  id: string;
  auction: string;
  lotNumber: string;
  saleDate: string | null;
  saleStatus: string;
  price: number | null;
  priceType: "sale-price" | "final-bid" | null;
  priceCurrency: string | null;
  odometer: number | null;
  primaryDamage: string;
  secondaryDamage: string;
  titleType: string;
  location: string;
  photos: string[];
};

export type AuqcionisIstoriisShedegi = {
  kind: "found" | "no-history";
  vin: string;
  vehicle: {
    make: string;
    model: string;
    year: number | null;
    series?: string;
    trim?: string;
    bodyClass?: string;
  } | null;
  history: AuqcionisIstoriisChanaceri[];
  historyTruncated: boolean;
  source?: string;
  sourceUrl?: string;
  message?: string;
};

export type AuqcionisFasisReferencia = {
  price: number;
  auction: string;
  date: string | null;
  lotNumber: string;
  priceType: "sale-price" | "final-bid" | null;
};


export type VinDzebnisApiPasuxi = {
  error?: string;
  identifier?: string;
  identifierType?: string;
  quality?: "complete" | "partial";
  vehicle?: unknown;
  fields?: unknown;
  internationalProviderConfigured?: unknown;
  internationalLookupStatus?: unknown;
  cardogConfigured?: unknown;
  lookupStatus?: unknown;
  providerWarnings?: unknown;
  providerMessage?: unknown;
  sources?: unknown;
  note?: unknown;
};

export type AuqcionisIstoriisApiPasuxi = {
  kind?: unknown;
  vin?: unknown;
  vehicle?: unknown;
  history?: unknown;
  source?: unknown;
  sourceUrl?: unknown;
  message?: unknown;
  historyTruncated?: unknown;
  error?: unknown;
};
