import test from "node:test";
import assert from "node:assert/strict";
import { vinidanDzravisMoculoba, manqanisAsaki, warmoebisTseliValiduria, normalizireDzravisMoculobaCc } from "./vehicle-import-inputs.mjs";

test("year validation does not treat a blank manufacture year as a real year", () => {
  assert.equal(manqanisAsaki(null, 2026), null);
  assert.equal(warmoebisTseliValiduria(null, 2026), false);
});

test("calculates age from an explicitly supplied manufacture year", () => {
  assert.equal(manqanisAsaki(2020, 2026), 6);
  assert.equal(warmoebisTseliValiduria(2020, 2026), true);
});

test("rejects a manufacture year after the declaration year", () => {
  assert.equal(manqanisAsaki(2027, 2026), null);
  assert.equal(warmoebisTseliValiduria(2027, 2026), false);
});


test("normalizes VIN engine capacity to whole cubic centimetres", () => {
  assert.equal(normalizireDzravisMoculobaCc(2998.832712), 2999);
  assert.equal(normalizireDzravisMoculobaCc(1496), 1496);
});

test("does not convert missing, non-finite, zero, negative or implausible engine capacities", () => {
  for (const value of [null, undefined, NaN, Infinity, 0, -1, 100001, "2998"]) {
    assert.equal(normalizireDzravisMoculobaCc(value), null);
  }
});

test("prefers a matched catalogue engine capacity over a rounded VIN figure", () => {
  assert.equal(vinidanDzravisMoculoba(2998.832712, 2997), 2997);
  assert.equal(vinidanDzravisMoculoba(2998.832712, null), 2999);
  assert.equal(vinidanDzravisMoculoba(2998.832712, 0), 2999);
});


test("does not infer engine capacity from the catalogue when VIN data omits displacement", () => {
  assert.equal(vinidanDzravisMoculoba(null, 2997), null);
  assert.equal(vinidanDzravisMoculoba(0, 2997), null);
  assert.equal(vinidanDzravisMoculoba("2998", 2997), null);
});
