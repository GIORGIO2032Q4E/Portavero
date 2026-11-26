import test from "node:test";
import assert from "node:assert/strict";
import { gaarchieNbgUsdKursi } from "./nbg-exchange-rate.mjs";

test("parses a per-unit USD quote from the NBG daily rate payload", () => {
  const result = gaarchieNbgUsdKursi([{
    date: "2026-11-20T00:00:00.000Z",
    currencies: [{
      code: "USD",
      quantity: 1,
      rate: 2.5926,
      date: "2026-11-20T17:01:02.046Z",
      validFromDate: "2026-11-21T00:00:00.000Z"
    }]
  }]);
  assert.deepEqual(result, {
    usdToGel: 2.5926,
    rateDate: "2026-11-20T17:01:02.046Z",
    validFromDate: "2026-11-21T00:00:00.000Z"
  });
});

test("divides NBG quotations by quantity instead of assuming a one-unit quote", () => {
  const result = gaarchieNbgUsdKursi([{
    currencies: [{ code: "USD", quantity: 10, rate: 25.926 }]
  }]);
  assert.equal(result.usdToGel, 2.5926);
});

test("returns null for missing, malformed or invalid USD rates", () => {
  assert.equal(gaarchieNbgUsdKursi(null), null);
  assert.equal(gaarchieNbgUsdKursi([]), null);
  assert.equal(gaarchieNbgUsdKursi([{ currencies: [] }]), null);
  assert.equal(gaarchieNbgUsdKursi([{ currencies: [{ code: "USD", quantity: 0, rate: 2.5 }] }]), null);
  assert.equal(gaarchieNbgUsdKursi([{ currencies: [{ code: "USD", quantity: 1, rate: "bad" }] }]), null);
});
