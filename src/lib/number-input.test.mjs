import test from "node:test";
import assert from "node:assert/strict";
import { gaarchieAraUaryofitiRicxvs } from "./number-input.mjs";

test("empty values remain blank rather than becoming zero", () => {
  assert.deepEqual(gaarchieAraUaryofitiRicxvs(""), { value: null, error: null });
});

test("accepts zero and positive amounts at cent precision", () => {
  assert.deepEqual(gaarchieAraUaryofitiRicxvs("0"), { value: 0, error: null });
  assert.deepEqual(gaarchieAraUaryofitiRicxvs("128.45"), { value: 128.45, error: null });
});

test("rejects negative amounts instead of treating them as valid costs", () => {
  assert.match(gaarchieAraUaryofitiRicxvs("-1.25").error, /negative/);
});

test("rejects more decimal places than the selected currency step allows", () => {
  assert.match(gaarchieAraUaryofitiRicxvs("10.001").error, /decimal places/);
});

test("whole-number fields reject fractions", () => {
  assert.match(gaarchieAraUaryofitiRicxvs("2.5", { step: 1 }).error, /whole number/);
  assert.deepEqual(gaarchieAraUaryofitiRicxvs("3", { step: 1 }), { value: 3, error: null });
});

test("JPY-style whole-unit fields do not accept fractional currency units", () => {
  assert.match(gaarchieAraUaryofitiRicxvs("25.5", { step: 1 }).error, /whole number/);
});

test("enforces an explicit maximum such as the 100 percent tax-rate limit", () => {
  assert.deepEqual(gaarchieAraUaryofitiRicxvs("100", { max: 100 }), { value: 100, error: null });
  assert.match(gaarchieAraUaryofitiRicxvs("100.01", { max: 100 }).error, /no greater than 100/);
});

test("rejects amounts that exceed safe minor-unit precision", () => {
  assert.match(gaarchieAraUaryofitiRicxvs("1e100").error, /too large/);
});

test("rejects non-finite values", () => {
  assert.match(gaarchieAraUaryofitiRicxvs("Infinity").error, /valid number/);
  assert.match(gaarchieAraUaryofitiRicxvs("NaN").error, /valid number/);
});

test("enforces the saved-vehicle engine-capacity limit on whole-number fields", () => {
  assert.deepEqual(
    gaarchieAraUaryofitiRicxvs("100000", { step: 1, max: 100000 }),
    { value: 100000, error: null }
  );
  assert.deepEqual(
    gaarchieAraUaryofitiRicxvs("100001", { step: 1, max: 100000 }),
    { value: null, error: "Enter a value no greater than 100000." }
  );
});
