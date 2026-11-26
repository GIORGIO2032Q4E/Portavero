/**
 * Portavero-shi amJamad realizebuli manqanis gadasaxadebis winaswari wesebi.
 *
 * Farglebi: HS 8703 kodit klasificirebuli archeuli samgzavro manqanebi. Es funqcia
 * gadasaxads itvlis sheyvanili wlis, dzravis moculobisa da konfiguraciis mixedvit. Is
 * ar adgens tarifis klasifikacias, registraciis uflebas,
 * gardamavali wesebit sargeblobis uflebas an akmayofilebs tu ara manqana
 * kanonit klasikuri manqanis kriteriumebs.
 *
 * wyaroebi gadamowmebulia 2026 wlis 9 noembers:
 * - Tax Code of Georgia, Articles 188 and 197:
 *   https://www.matsne.gov.ge/en/document/view/1043717
 * - Revenue Service car-clearance calculator and listed fees:
 *   https://www.rs.ge/CarClearance-en
 * - Ministry announcement (12 March 2026) replacing the planned 6-year
 *   registration ban with a higher excise tariff:
 *   https://mepa.gov.ge/Ge/News/Details/26330
 *
 * Gardamavali wesebi momkhmarebels xelit shehyavs. Gamoyenebis adgilma unda ganmartos, rom
 * dzveli reJimis archeva uflebas ar adasturebs.
 */

// Asakze damokidebuli istoriuli aktsizis cxrili gamoiyeneba mxolod roca momkhmarebeli archevs
// wina reJims da fiqrobs, rom gardamavali pirobebi exeba.
const winaAktsizisGanakvetebi = [1.5, 1.5, 1.5, 1.4, 1.2, 1.0, 0.8, 0.8, 0.8, 0.9, 1.1, 1.3, 1.5, 1.8, 2.1, 2.4];

/**
 * Calculate the project's preliminary vehicle-tax figures.
 *
 * @param {{
 *   manufactureYear: number,
 *   declarationYear: number,
 *   engineCc: number,
 *   steering: string,
 *   hybrid: boolean,
 *   classicCar: boolean,
 *   isElectric: boolean,
 *   preAprilRegime: boolean
 * }} input
 * @returns {{
 *   age: number,
 *   eligibleYear: boolean,
 *   validEngine: boolean,
 *   validVehicleType: boolean,
 *   rate: number,
 *   excise: number,
 *   importDuty: number
 * }}
 */
export function gamotvaleManqanisGadasaxadebi({
  manufactureYear,
  declarationYear,
  engineCc,
  steering,
  hybrid,
  classicCar,
  isElectric,
  preAprilRegime
}) {
  const age = declarationYear - manufactureYear;
  const eligibleYear = age >= 0;
  const validEngine = isElectric || (Number.isFinite(engineCc) && engineCc > 0);
  const validVehicleType = !classicCar || age > 30;
  const rateAge = Math.max(0, age);

  let rate = preAprilRegime
    ? winaAktsizisGanakvetebi[Math.min(rateAge, winaAktsizisGanakvetebi.length - 1)]
    : rateAge <= 6 ? 1.5 : 4.5;

  if (classicCar && rateAge > 30) rate = 1;

  if (!isElectric && !classicCar) {
    if (steering === "right") rate *= 3;
    else if (steering === "left" && hybrid && rateAge <= 6) rate *= 0.4;
  }

  const excise = eligibleYear && validEngine && validVehicleType
    ? isElectric
      ? steering === "right" ? (preAprilRegime ? rate * 2000 : 3000) : 0
      : classicCar && rateAge > 30 ? engineCc : engineCc * rate
    : 0;

  // Article 197(6) adds 5% of the base duty for each year in operation.
  // The Revenue Service calculator applies one year at minimum, including
  // a vehicle whose manufacture year equals the declaration year.
  const yearsInOperation = Math.max(1, rateAge);
  const importDuty = eligibleYear && validEngine && validVehicleType && !isElectric
    ? engineCc * 0.05 * (1 + yearsInOperation * 0.05)
    : 0;

  return {
    age,
    eligibleYear,
    validEngine,
    validVehicleType,
    rate,
    excise,
    importDuty
  };
}
