/**
 * Email-is ertiani shemowmeba registraciis, sesiaSi shesvlisa da parolis aghdgenistvis;
 * wesebi martivi da yvela adgilas ertnairi unda iyos.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizireAngarishisEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function angarisheEmailValiduria(value) {
  if (typeof value !== "string") return false;
  const email = normalizireAngarishisEmail(value);
  return email.length > 0 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
