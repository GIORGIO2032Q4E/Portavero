/**
 * Manqanis tipis archeviti mnishvneloba.
 *
 * Manualur tipze gadasvla katalogidan archeul dzravs azerianebs. Forma
 * moculobasac asuftavebs, amitom momkhmarebelma dokumentebit unda daadasturos.
 *
 * @param {unknown} value
 * @returns {{ engineId: string, hybrid: boolean, classicCar: boolean }}
 */
export function archevitiManqanisTipi(value) {
  return {
    engineId: "",
    hybrid: value === "hybrid",
    classicCar: value === "classic"
  };
}

/**
 * Daabrune usafrtxo moculoba katalogidan archeuli dzravistvis.
 *
 * Nulovani moculobis eleqtro versia validuria. Nulovani moculobis benzinis, dizelis
 * an hibriduli varianti nishnavs, rom katalogma zusti moculoba ar icis.
 *
 * @param {{ cc?: unknown, fuel?: unknown } | null | undefined} engine
 * @returns {number | null}
 */
export function archeuliDzravisMoculoba(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (engine.fuel === "Electric") return 0;

  return typeof engine.cc === "number" &&
    Number.isFinite(engine.cc) &&
    engine.cc > 0
    ? engine.cc
    : null;
}

/**
 * @param {{ primaryFuelType?: unknown, secondaryFuelType?: unknown, electrificationLevel?: unknown }} details
 */
export function vinisDzravisTipi(details = {}) {
  const primary = typeof details.primaryFuelType === "string" ? details.primaryFuelType.trim().toLowerCase() : "";
  const secondary = typeof details.secondaryFuelType === "string" ? details.secondaryFuelType.trim().toLowerCase() : "";
  const electrification = typeof details.electrificationLevel === "string" ? details.electrificationLevel.trim().toLowerCase() : "";
  const combined = [primary, secondary, electrification].join(" ");
  const hybridLevel = /hybrid|phev|hev|mhev|plug.?in/.test([primary, secondary, electrification].join(" "));
  const plugInHybrid = /plug.?in|phev/.test([primary, secondary, electrification].join(" "));
  const hasElectric = /electric|battery|bev/.test(combined);
  const hasCombustion = /gasoline|petrol|diesel|ethanol|lpg|propane|cng|natural gas|hydrogen/.test(combined);
  const pureElectricLevel = /battery electric|bev|pure electric|all electric/.test(electrification);
  const isElectric = !hybridLevel && (pureElectricLevel || (hasElectric && !hasCombustion));
  const isHybrid = !isElectric && (hybridLevel || (hasElectric && hasCombustion));

  let fuel = "unknown";
  if (isElectric) fuel = "Electric";
  else if (isHybrid) fuel = plugInHybrid ? "Plug-in hybrid" : "Hybrid";
  else if (/diesel/.test(primary || secondary)) fuel = "Diesel";
  else if (/gasoline|petrol/.test(primary || secondary)) fuel = "Petrol";
  else if (/liquefied petroleum|\blpg\b|propane/.test(combined)) fuel = "LPG";
  else if (/compressed natural gas|\bcng\b|natural gas/.test(combined)) fuel = "CNG";

  return {
    fuel,
    isElectric,
    isHybrid,
    isPlugInHybrid: plugInHybrid,
    needsConfirmation: fuel === "unknown"
  };
}

/**
 * @param {unknown} value
 * @returns {"" | "left" | "right"}
 */
export function martvisMkhare(value) {
  if (typeof value !== "string") return "";
  const steering = value.trim().toLowerCase();

  if (/right/.test(steering) || /\brhd\b/.test(steering)) return "right";
  if (/left/.test(steering) || /\blhd\b/.test(steering)) return "left";

  return "";
}

const vinMakeAliases = {
  vw: "volkswagen",
  mercedes: "mercedesbenz",
  mercedesamg: "mercedesbenz",
  benz: "mercedesbenz"
};

function normalizireManqanisSaxeli(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * VIN-is monacemebit miRebuli markis katalogshi povna gamogonili damtxvevis gareShe.
 * @template {{name: string}} T
 * @param {T[] | undefined} makes
 * @param {unknown} value
 * @returns {T | undefined}
 */
export function ipoveMarka(makes, value) {
  if (!Array.isArray(makes) || typeof value !== "string") return undefined;

  const key = normalizireManqanisSaxeli(value);
  if (!key) return undefined;

  const canonicalKey = vinMakeAliases[key] ?? key;
  return makes.find((make) => normalizireManqanisSaxeli(make.name) === canonicalKey);
}

/**
 * VIN-is modelis lokalur katalogtan shedareba gamocnobis gareShe
 * roca modeli ar aris miTiTebuli an ramdenime variants emTxveva.
 *
 * zusti normalizirebuli saxeli prioritetulia. Ufro grZeli gashifruli saxeli sheidzleba ert
 * ufro mokle katalogis saxels daemTxves (magalitad, kompleqtaciis an dzaris damateba). Mokle
 * nawilobrivi saxeli mxolod mashin miiReba, roca ertaderT variants miuTiTebs.
 *
 * @template {{ name: string }} T
 * @param {T[] | undefined} models
 * @param {unknown} value
 * @returns {T | undefined}
 */
export function ipoveModeli(models, value) {
  if (!Array.isArray(models) || typeof value !== "string") return undefined;

  const key = value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!key) return undefined;

  const normalized = models.map((item) => ({
    item,
    key: item.name.toLowerCase().replace(/[^a-z0-9]/g, "")
  })).filter((entry) => entry.key.length >= 3);

  const exact = normalized.filter((entry) => entry.key === key);
  if (exact.length === 1) return exact[0].item;
  if (exact.length > 1) return undefined;

  const compatible = normalized.filter((entry) =>
    key.length >= 3 &&
    (key.startsWith(entry.key) || (key.length >= 4 && entry.key.startsWith(key)))
  );
  if (compatible.length === 0) return undefined;

  const longestLength = Math.max(...compatible.map((entry) => entry.key.length));
  const best = compatible.filter((entry) => entry.key.length === longestLength);
  return best.length === 1 ? best[0].item : undefined;
}
