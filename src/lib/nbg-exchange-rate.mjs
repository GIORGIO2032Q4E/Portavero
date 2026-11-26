export const NBG_USD_KURSIS_MISAMARTI = "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD";

export function gaarchieNbgUsdKursi(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return null;

  const rateSet = payload[0];
  if (!rateSet || typeof rateSet !== "object" || !Array.isArray(rateSet.currencies)) return null;

  const usd = rateSet.currencies.find((currency) => currency?.code === "USD");
  if (!usd) return null;

  const rate = Number(usd.rate);
  const quantity = Number(usd.quantity);
  const usdToGel = rate / quantity;

  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(usdToGel) || usdToGel <= 0) {
    return null;
  }

  return {
    usdToGel: Math.round((usdToGel + Number.EPSILON) * 1000000) / 1000000,
    rateDate: typeof usd.date === "string" ? usd.date : typeof rateSet.date === "string" ? rateSet.date : null,
    validFromDate: typeof usd.validFromDate === "string" ? usd.validFromDate : null
  };
}
