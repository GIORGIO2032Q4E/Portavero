import test from "node:test";
import assert from "node:assert/strict";
import {
  archeuliDzravisMoculoba,
  archevitiManqanisTipi,
  vinisDzravisTipi,
  martvisMkhare
} from "./vehicle-selection.mjs";

test("manual hybrid selection clears the catalogue engine", () => {
  assert.deepEqual(archevitiManqanisTipi("hybrid"), {
    engineId: "",
    hybrid: true,
    classicCar: false
  });
});

test("manual classic-car selection clears the catalogue engine", () => {
  assert.deepEqual(archevitiManqanisTipi("classic"), {
    engineId: "",
    hybrid: false,
    classicCar: true
  });
});

test("manual non-hybrid selection clears hybrid and classic flags", () => {
  assert.deepEqual(archevitiManqanisTipi("other"), {
    engineId: "",
    hybrid: false,
    classicCar: false
  });
});

test("unknown manual values safely resolve to the ordinary non-hybrid option", () => {
  assert.deepEqual(archevitiManqanisTipi(null), {
    engineId: "",
    hybrid: false,
    classicCar: false
  });
});

test("known combustion-engine capacity is used", () => {
  assert.equal(archeuliDzravisMoculoba({ cc: 1998, fuel: "Petrol" }), 1998);
  assert.equal(archeuliDzravisMoculoba({ cc: 1968, fuel: "Diesel" }), 1968);
});

test("ambiguous zero-capacity combustion variants require manual entry", () => {
  assert.equal(archeuliDzravisMoculoba({ cc: 0, fuel: "Petrol" }), null);
  assert.equal(archeuliDzravisMoculoba({ cc: 0, fuel: "Diesel" }), null);
  assert.equal(archeuliDzravisMoculoba({ cc: 0, fuel: "Hybrid" }), null);
});

test("electric variants retain zero engine capacity", () => {
  assert.equal(archeuliDzravisMoculoba({ cc: 0, fuel: "Electric" }), 0);
});

test("invalid catalogue capacity values are rejected", () => {
  for (const cc of [undefined, null, -1, Infinity, NaN, "2000"]) {
    assert.equal(archeuliDzravisMoculoba({ cc, fuel: "Petrol" }), null);
  }
});

test("recognizes a petrol hybrid from primary and secondary VIN fuels", () => {
  assert.deepEqual(vinisDzravisTipi({
    primaryFuelType: "Gasoline",
    secondaryFuelType: "Electric",
    electrificationLevel: "Hybrid Electric Vehicle (HEV)"
  }), {
    fuel: "Hybrid",
    isElectric: false,
    isHybrid: true,
    isPlugInHybrid: false,
    needsConfirmation: false
  });
});

test("recognizes a plug-in hybrid from NHTSA electrification data", () => {
  const result = vinisDzravisTipi({
    primaryFuelType: "Gasoline",
    secondaryFuelType: "Electric",
    electrificationLevel: "Plug-in Hybrid Electric Vehicle (PHEV)"
  });
  assert.equal(result.fuel, "Plug-in hybrid");
  assert.equal(result.isHybrid, true);
  assert.equal(result.isElectric, false);
});

test("recognizes a battery electric vehicle without treating it as a hybrid", () => {
  const result = vinisDzravisTipi({
    primaryFuelType: "Electric",
    electrificationLevel: "Battery Electric Vehicle (BEV)"
  });
  assert.equal(result.fuel, "Electric");
  assert.equal(result.isElectric, true);
  assert.equal(result.isHybrid, false);
});

test("does not guess a fuel category when VIN fuel data is absent", () => {
  const result = vinisDzravisTipi({});
  assert.equal(result.fuel, "unknown");
  assert.equal(result.needsConfirmation, true);
});

test("recognizes explicit steering location only", () => {
  assert.equal(martvisMkhare("Left-Hand Drive"), "left");
  assert.equal(martvisMkhare("Right-Hand Drive"), "right");
  assert.equal(martvisMkhare("Unknown"), "");
  assert.equal(martvisMkhare(null), "");
});

test("does not choose a catalogue model when the decoded VIN model is blank", async () => {
  const { ipoveModeli } = await import("./vehicle-selection.mjs");
  const models = [
    { name: "Noah", engines: [{ id: "noah-2.0", cc: 1986 }] },
    { name: "Voxy", engines: [{ id: "voxy-2.0", cc: 1986 }] },
    { name: "Esquire", engines: [{ id: "esquire-2.0", cc: 1986 }] }
  ];

  assert.equal(ipoveModeli(models, ""), undefined);
  assert.equal(ipoveModeli(models, "   "), undefined);
  assert.equal(ipoveModeli(models, null), undefined);
});

test("matches an exact decoded model name after normalization", async () => {
  const { ipoveModeli } = await import("./vehicle-selection.mjs");
  const models = [{ name: "C-Class" }, { name: "E-Class" }];
  assert.deepEqual(ipoveModeli(models, "c class"), { name: "C-Class" });
});

test("maps a longer decoded model to one unique catalogue base model", async () => {
  const { ipoveModeli } = await import("./vehicle-selection.mjs");
  const models = [{ name: "Golf" }, { name: "Passat" }];
  assert.deepEqual(ipoveModeli(models, "Golf Variant"), { name: "Golf" });
});

test("does not guess when a shortened decoded model matches multiple catalogue entries", async () => {
  const { ipoveModeli } = await import("./vehicle-selection.mjs");
  const models = [{ name: "GX460" }, { name: "GX470" }];
  assert.equal(ipoveModeli(models, "GX4"), undefined);
  assert.equal(ipoveModeli(models, "GX"), undefined);
});


test("matches catalogue makes by normalized name", async () => {
  const { ipoveMarka } = await import("./vehicle-selection.mjs");
  const makes = [{ name: "Toyota" }, { name: "Volkswagen" }, { name: "Mercedes-Benz" }];

  assert.deepEqual(ipoveMarka(makes, "toyota"), { name: "Toyota" });
  assert.deepEqual(ipoveMarka(makes, "VW"), { name: "Volkswagen" });
  assert.deepEqual(ipoveMarka(makes, "Mercedes"), { name: "Mercedes-Benz" });
});

test("does not invent a make when the decoded name is missing or unknown", async () => {
  const { ipoveMarka } = await import("./vehicle-selection.mjs");
  const makes = [{ name: "Toyota" }];

  assert.equal(ipoveMarka(makes, ""), undefined);
  assert.equal(ipoveMarka(makes, "   "), undefined);
  assert.equal(ipoveMarka(makes, null), undefined);
  assert.equal(ipoveMarka(makes, "Unknown make"), undefined);
});
