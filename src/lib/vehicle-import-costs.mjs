export const MANQANIS_IMPORTIS_KHARJEBIS_VELEBI = [
  "purchase",
  "auction",
  "inland",
  "shipping",
  "insurance",
  "port",
  "delivery"
];

/**
 * Manqanis gaformebisa da registraciis shvidi standartuli mosakreblis snapshot.
 * Sakartvelos Semosavlebis samsaxuris sia, gadamowmebuli 2026 wlis 9 noembers.
 * Es ar aris live monacemebis gamotana; gamoyenebamde sheamowme mimdinare tarifebi.
 *
 * Source: https://www.rs.ge/CarClearance-en
 */
export const STANDARTULI_SAKHELMTSIFO_MOSAKREBEBI_GEL = 480;

const maqsimaluriUsafrtxoTanxa = Number.MAX_SAFE_INTEGER / 100;

function tanxaUsafrtkhoa(value) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= maqsimaluriUsafrtxoTanxa;
}

function kharjiUsafrtkhoa(value) {
  if (!tanxaUsafrtkhoa(value)) return false;
  const scaled = value * 100;
  return Number.isFinite(scaled) &&
    Math.abs(scaled - Math.round(scaled)) <= 1e-7;
}

/**
 * Seajame mxolod sheyvanili manqanis importis kharjebi. Gadasaxadebis gamotvla xdeba
 * arsebuli manqanis gadasaxadebis modulis mier da aq ar icvleba.
 *
 * @param {{purchase: number|null, auction: number|null, inland: number|null, shipping: number|null, insurance: number|null, port: number|null, delivery: number|null}} costs
 * @param {number} excise
 * @param {number} importDuty
 * @param {number} officialFees
 * @param {boolean} hasInvalidInput True, roca romelime velma mnishvneloba am funqciamde misvlamde uaryo.
 */
export function sheajameImportisKharjebi(costs, excise, importDuty, officialFees = STANDARTULI_SAKHELMTSIFO_MOSAKREBEBI_GEL, hasInvalidInput = false) {
  const invalidCosts = MANQANIS_IMPORTIS_KHARJEBIS_VELEBI.filter((key) => {
    const value = costs[key];
    return value !== null && !kharjiUsafrtkhoa(value);
  });
  const unknownCosts = MANQANIS_IMPORTIS_KHARJEBIS_VELEBI.filter((key) => costs[key] === null);
  const knownCostsRaw = MANQANIS_IMPORTIS_KHARJEBIS_VELEBI.reduce((sum, key) => {
    const value = costs[key];
    return sum + (kharjiUsafrtkhoa(value) ? value : 0);
  }, 0);
  const knownCosts = tanxaUsafrtkhoa(knownCostsRaw) ? knownCostsRaw : null;
  const invalidTaxAmounts = !tanxaUsafrtkhoa(excise) ||
    !tanxaUsafrtkhoa(importDuty) ||
    !tanxaUsafrtkhoa(officialFees);
  const total = (knownCosts ?? 0) + excise + importDuty + officialFees;
  const invalidAmounts = invalidCosts.length > 0 ||
    invalidTaxAmounts ||
    knownCosts === null ||
    !tanxaUsafrtkhoa(total) ||
    hasInvalidInput;

  return {
    knownCosts,
    unknownCosts,
    invalidCosts,
    invalidTaxAmounts,
    invalidAmounts,
    total: invalidAmounts ? null : total
  };
}
