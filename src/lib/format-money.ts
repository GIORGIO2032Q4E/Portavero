const gelFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "GEL",
  maximumFractionDigits: 2
});

export function formatireGelTanxa(value: number) {
  return gelFormatter.format(value);
}
