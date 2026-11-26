/**
 * Wyaros mier dabrunebuli dzravis moculoba mTel kubur santimetrebamde normalizirdeba.
 * VIN dekodirebis servisebi zogjer gamoTvlil wilad cc-s abruneben, miuxedavad imisa, rom
 * kalkulatori mTel cm3-ze mushaobs. Aravaliduri an aradamlajerebeli mnishvnelobebi
 * ucnobad rcheba da dzravis zomas ar vugonebt.
 * @param {unknown} value
 * @returns {number|null}
 */
export function normalizireDzravisMoculobaCc(value) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 100000
  ) {
    return null;
  }

  const rounded = Math.round(value);
  return Number.isSafeInteger(rounded) && rounded > 0 ? rounded : null;
}

/**
 * Tu katalogshi zusti varianti moidzebna, misi moculoba upiratesia servisis damrgvalebul mnishvnelobaze.
 * Katalogis mnishvneloba mxolod manqanis da
 * dzravis tipis damtxvevis shemdeg unda gadavides; sxva shemtxvevashi wyaros mnishvneloba rcheba.
 * @param {unknown} reportedCapacity
 * @param {unknown} catalogueCapacity
 * @returns {number|null}
 */
export function vinidanDzravisMoculoba(reportedCapacity, catalogueCapacity = null) {
  const normalizedReportedCapacity = normalizireDzravisMoculobaCc(reportedCapacity);
  if (normalizedReportedCapacity === null) return null;

  return normalizireDzravisMoculobaCc(catalogueCapacity) ?? normalizedReportedCapacity;
}

/**
 * Daabrune importis kalkulatoristvis gamoyenebuli asaki, an null, roca warmoebis weli
 * ucnobia an sheyvanili wlebi aravaliduria.
 * @param {number|null} manufactureYear
 * @param {number} declarationYear
 */
export function manqanisAsaki(manufactureYear, declarationYear) {
  if (!Number.isInteger(manufactureYear) || !Number.isInteger(declarationYear)) return null;
  if (manufactureYear < 1886 || declarationYear < manufactureYear) return null;
  return declarationYear - manufactureYear;
}

/**
 * Warmoebis weli aucileblad unda iyos miTiTebuli da ar unda iyos ufro gviani, vidre
 * archeuli sabajo deklaraciis weli.
 * @param {number|null} manufactureYear
 * @param {number} declarationYear
 */
export function warmoebisTseliValiduria(manufactureYear, declarationYear) {
  return manqanisAsaki(manufactureYear, declarationYear) !== null;
}
