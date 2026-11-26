export const KHARJIS_SHEFASEBIS_WYAROEBI = {
  auction: "https://apiauctions.io/docs",
  copart: "https://www.copart.com/content/us/en/member-fees",
  shipping: "https://theflipradar.com/guides/ship-car-usa-to-georgia",
  insurance: "https://www.ipas.express/ipas-express/usa-to-georgia",
  exchangeRate: "https://nbg.gov.ge/en/monetary-policy/currency",
  exchangeRateApi: "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/"
};

export const ASHSH_POTIS_SAKONTRO_DIAPAZONEBI = {
  lastChecked: "2026-10-20",
  inland: { min: 175, max: 900, currency: "USD" },
  shipping: {
    roro: { min: 1200, max: 1650, currency: "USD" },
    sharedContainer: { min: 1500, max: 2400, currency: "USD" },
    ownContainer: { min: 2000, max: 5400, currency: "USD" }
  },
  poti: { min: 300, max: 400, currency: "USD" },
  insuranceRate: 0.002
};

const securedBuyerFees = {
  clean: [
    [49.99, 25], [99.99, 45], [199.99, 80], [399.99, 120],
    [499.99, 160], [599.99, 185], [699.99, 210], [799.99, 230],
    [899.99, 250], [999.99, 275], [1199.99, 325], [1299.99, 350],
    [1399.99, 365], [1499.99, 380], [1599.99, 390], [1699.99, 410],
    [1799.99, 420], [1999.99, 440], [2399.99, 470], [2499.99, 480],
    [2999.99, 500], [3499.99, 600], [3999.99, 675], [4499.99, 710],
    [4999.99, 745]
  ],
  nonClean: [
    [49.99, 25], [99.99, 45], [199.99, 80], [299.99, 130],
    [349.99, 137.5], [399.99, 145], [449.99, 175], [499.99, 185],
    [549.99, 205], [599.99, 210], [699.99, 240], [799.99, 270],
    [899.99, 295], [999.99, 320], [1199.99, 375], [1299.99, 395],
    [1399.99, 410], [1499.99, 430], [1599.99, 445], [1699.99, 465],
    [1799.99, 485], [1999.99, 510], [2399.99, 535], [2499.99, 570],
    [2999.99, 610], [3499.99, 655], [3999.99, 705], [4499.99, 725],
    [4999.99, 750], [5499.99, 775], [5999.99, 800], [6499.99, 825],
    [6999.99, 845], [7499.99, 880], [7999.99, 900], [8499.99, 925],
    [8999.99, 945], [9999.99, 945], [10499.99, 1000], [10999.99, 1000],
    [11499.99, 1000], [11999.99, 1000], [12499.99, 1000], [14999.99, 1000]
  ]
};

const unsecuredBuyerFees = {
  clean: [
    [49.99, 27.5], [99.99, 50], [199.99, 90], [299.99, 135],
    [349.99, 137.5], [399.99, 140], [449.99, 182.5], [499.99, 185],
    [549.99, 212.5], [599.99, 215], [699.99, 245], [799.99, 270],
    [899.99, 295], [999.99, 325], [1199.99, 385], [1299.99, 415],
    [1399.99, 435], [1499.99, 455], [1599.99, 470], [1699.99, 495],
    [1799.99, 510], [1999.99, 540], [2399.99, 590], [2499.99, 605],
    [2999.99, 650], [3499.99, 775], [3999.99, 875], [4499.99, 935],
    [4999.99, 995]
  ],
  nonClean: [
    [49.99, 27.5], [99.99, 50], [199.99, 90], [299.99, 145],
    [349.99, 155], [399.99, 167.5], [449.99, 200], [499.99, 210],
    [549.99, 235], [599.99, 240], [699.99, 275], [799.99, 312.5],
    [899.99, 342.5], [999.99, 370], [1199.99, 440], [1299.99, 460],
    [1399.99, 482.5], [1499.99, 510], [1599.99, 530], [1699.99, 555],
    [1799.99, 582.5], [1999.99, 620], [2399.99, 662.5], [2499.99, 705],
    [2999.99, 775], [3499.99, 830], [3999.99, 927.5], [4499.99, 935],
    [4999.99, 1000], [5499.99, 1025], [5999.99, 1055], [6499.99, 1085],
    [6999.99, 1110], [7499.99, 1145], [7999.99, 1175], [8499.99, 1200],
    [8999.99, 1225], [9999.99, 1225], [10499.99, 1390], [10999.99, 1390],
    [11499.99, 1390], [11999.99, 1400], [12499.99, 1400], [14999.99, 1400]
  ]
};

const virtualBidFees = {
  preBid: [[99.99, 0], [499.99, 40], [999.99, 55], [1499.99, 75], [1999.99, 85], [3999.99, 100], [5999.99, 110], [7999.99, 125], [Number.MAX_SAFE_INTEGER, 140]],
  live: [[99.99, 0], [499.99, 50], [999.99, 65], [1499.99, 85], [1999.99, 95], [3999.99, 110], [5999.99, 125], [7999.99, 145], [Number.MAX_SAFE_INTEGER, 160]]
};

// Standard passenger-vehicle Copart charges from the published fee schedule.
const copartStandardVehicleGateFee = 95;
const copartStandardVehicleEnvironmentalFee = 15;

function feeFromTiers(amount, tiers, overLimitRate) {
  const tier = tiers.find(([limit]) => amount <= limit);
  return tier ? tier[1] : amount * overLimitRate;
}

export function gamotvaleCopartisKharjebi({
  bidUsd,
  titleType = "unknown",
  paymentType = "secured",
  bidType = "live"
}) {
  if (!Number.isFinite(bidUsd) || bidUsd < 0 || bidUsd > 10_000_000) return null;

  const feeTable = paymentType === "unsecured" ? unsecuredBuyerFees : securedBuyerFees;
  if (titleType !== "clean" && titleType !== "nonClean") return null;

  const buyerFee = feeFromTiers(
    bidUsd,
    feeTable[titleType === "clean" ? "clean" : "nonClean"],
    titleType === "clean"
      ? (paymentType === "unsecured" ? 0.20 : 0.15)
      : (paymentType === "unsecured" ? 0.125 : 0.075)
  );
  const bidSchedule = virtualBidFees[bidType === "preBid" ? "preBid" : "live"];
  const virtualBidFee = feeFromTiers(bidUsd, bidSchedule, 0);
  const gateFee = copartStandardVehicleGateFee;
  const environmentalFee = copartStandardVehicleEnvironmentalFee;

  // Storage, late-payment, title handling, relist and other conditional charges are excluded.
  return {
    buyerFee: roundMoney(buyerFee),
    virtualBidFee: roundMoney(virtualBidFee),
    gateFee,
    environmentalFee,
    total: roundMoney(buyerFee + virtualBidFee + gateFee + environmentalFee)
  };
}

export function diapazonisShualedi(range) {
  return roundMoney((range.min + range.max) / 2);
}

export function gadaiyvaneUsdGelshi(amountUsd, usdToGel) {
  if (!Number.isFinite(amountUsd) || amountUsd < 0 || !Number.isFinite(usdToGel) || usdToGel <= 0) {
    return null;
  }
  return roundMoney(amountUsd * usdToGel);
}

export function sheqmeniAshshPotiSheTavazebebi({
  purchaseUsd,
  usdToGel,
  shippingMethod = "sharedContainer",
  titleType = "unknown",
  paymentType = "secured",
  bidType = "live",
  pickupAtPoti = false,
  auctionPlatform = "copart"
}) {
  if (!Number.isFinite(usdToGel) || usdToGel <= 0) return null;

  const shippingRange = ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.shipping[shippingMethod] ??
    ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.shipping.sharedContainer;
  const inlandRange = ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.inland;
  const portRange = shippingMethod === "sharedContainer" ? ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.poti : null;
  const bidKnown = Number.isFinite(purchaseUsd) && purchaseUsd > 0;
  const auctionFees = bidKnown && auctionPlatform === "copart" && titleType !== "unknown"
    ? gamotvaleCopartisKharjebi({ bidUsd: purchaseUsd, titleType, paymentType, bidType })
    : null;
  const insuranceRange = bidKnown
    ? { min: purchaseUsd * ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.insuranceRate, max: purchaseUsd * ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.insuranceRate, currency: "USD" }
    : null;

  const valuesUsd = {
    purchase: bidKnown ? purchaseUsd : null,
    auction: auctionFees?.total ?? null,
    inland: diapazonisShualedi(inlandRange),
    shipping: diapazonisShualedi(shippingRange),
    insurance: insuranceRange ? diapazonisShualedi(insuranceRange) : null,
    port: portRange ? diapazonisShualedi(portRange) : null,
    delivery: pickupAtPoti ? 0 : null
  };

  const valuesGel = Object.fromEntries(
    Object.entries(valuesUsd).map(([key, value]) => [
      key,
      value === null ? null : gadaiyvaneUsdGelshi(value, usdToGel)
    ])
  );

  return {
    valuesGel,
    valuesUsd,
    rangesUsd: {
      purchase: null,
      auction: null,
      inland: inlandRange,
      shipping: shippingRange,
      insurance: insuranceRange,
      port: portRange,
      delivery: pickupAtPoti ? { min: 0, max: 0, currency: "USD" } : null
    },
    auctionFees,
    usdToGel,
    sourceCheckedAt: ASHSH_POTIS_SAKONTRO_DIAPAZONEBI.lastChecked
  };
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
