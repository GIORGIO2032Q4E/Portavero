import test from "node:test";
import assert from "node:assert/strict";
import { gamotvaleManqanisGadasaxadebi } from "./vehicle-tax.mjs";

const gamotvale = (overrides = {}) => gamotvaleManqanisGadasaxadebi({
  manufactureYear: 2020,
  declarationYear: 2026,
  engineCc: 2000,
  steering: "left",
  hybrid: false,
  classicCar: false,
  isElectric: false,
  preAprilRegime: false,
  ...overrides
});

test("current rate is GEL 1.50/cm³ for age 0 through 6", () => {
  for (const age of [0, 1, 6]) {
    const result = gamotvale({ manufactureYear: 2026 - age });
    assert.equal(result.rate, 1.5);
    assert.equal(result.excise, 3000);
  }
});

test("current rate is GEL 4.50/cm³ at age 7 and above, without treating age as a registration ban", () => {
  const result = gamotvale({ manufactureYear: 2019 });
  assert.equal(result.rate, 4.5);
  assert.equal(result.excise, 9000);
  assert.equal(Object.hasOwn(result, "registrationRestricted"), false);
});

test("left-hand-drive hybrid age 0 through 6 gets a 60% excise reduction", () => {
  const result = gamotvale({ hybrid: true });
  assert.ok(Math.abs(result.rate - 0.6) < 1e-9);
  assert.ok(Math.abs(result.excise - 1200) < 1e-9);
});

test("right-hand-drive non-electric car uses triple excise", () => {
  const result = gamotvale({ steering: "right" });
  assert.equal(result.rate, 4.5);
  assert.equal(result.excise, 9000);
});

test("right-hand-drive hybrid uses triple excise without the left-hand-drive hybrid reduction", () => {
  const result = gamotvale({ steering: "right", hybrid: true });
  assert.equal(result.rate, 4.5);
  assert.equal(result.excise, 9000);
});

test("import duty uses engine size and vehicle age, not the steering multiplier", () => {
  const sixYearsOld = gamotvale({ manufactureYear: 2020 });
  const sevenYearsOld = gamotvale({ manufactureYear: 2019 });
  const rightHandDrive = gamotvale({ steering: "right" });

  assert.equal(sixYearsOld.importDuty, 130);
  assert.equal(sevenYearsOld.importDuty, 135);
  assert.equal(rightHandDrive.importDuty, 130);
});

test("invalid engine capacity produces no vehicle taxes", () => {
  const result = gamotvale({ engineCc: 0 });
  assert.equal(result.validEngine, false);
  assert.equal(result.excise, 0);
  assert.equal(result.importDuty, 0);
});

test("left-hand-drive electric car has zero excise and import duty", () => {
  const result = gamotvale({ isElectric: true, engineCc: 0 });
  assert.equal(result.excise, 0);
  assert.equal(result.importDuty, 0);
});

test("right-hand-drive electric car uses the current fixed GEL 3,000 excise", () => {
  const result = gamotvale({ isElectric: true, steering: "right", engineCc: 0 });
  assert.equal(result.excise, 3000);
  assert.equal(result.importDuty, 0);
});

test("previous regime uses the historical age table for eligible transitional cases", () => {
  const newCar = gamotvale({ manufactureYear: 2026, preAprilRegime: true });
  assert.equal(newCar.rate, 1.5);
  const sixYearsOld = gamotvale({ manufactureYear: 2020, preAprilRegime: true });
  assert.equal(sixYearsOld.rate, 0.8);
  const twelveYearsOld = gamotvale({ manufactureYear: 2014, preAprilRegime: true });
  assert.equal(twelveYearsOld.rate, 1.5);
});

test("classic car rate applies only above 30 years", () => {
  const result = gamotvale({ manufactureYear: 1995, classicCar: true });
  assert.equal(result.rate, 1);
  assert.equal(result.excise, 2000);
  const tooYoung = gamotvale({ manufactureYear: 1996, classicCar: true });
  assert.equal(tooYoung.validVehicleType, false);
  assert.equal(tooYoung.excise, 0);
});

test("future manufacture year is invalid and produces no taxes", () => {
  const result = gamotvale({ manufactureYear: 2027, declarationYear: 2026 });
  assert.equal(result.eligibleYear, false);
  assert.equal(result.excise, 0);
  assert.equal(result.importDuty, 0);
});

test("hybrid reduction stops after vehicle age 6", () => {
  const sixYearsOld = gamotvale({ manufactureYear: 2020, hybrid: true });
  const sevenYearsOld = gamotvale({ manufactureYear: 2019, hybrid: true });
  assert.ok(Math.abs(sixYearsOld.rate - 0.6) < 1e-9);
  assert.equal(sevenYearsOld.rate, 4.5);
  assert.equal(sevenYearsOld.excise, 9000);
});

test("classic-car threshold is strictly more than 30 years", () => {
  const exactlyThirty = gamotvale({ manufactureYear: 1996, declarationYear: 2026, classicCar: true });
  const thirtyOne = gamotvale({ manufactureYear: 1995, declarationYear: 2026, classicCar: true });
  assert.equal(exactlyThirty.validVehicleType, false);
  assert.equal(exactlyThirty.excise, 0);
  assert.equal(thirtyOne.validVehicleType, true);
  assert.equal(thirtyOne.excise, 2000);
});

test("negative, infinite, and non-numeric engine values are rejected", () => {
  for (const engineCc of [-1, Infinity, NaN, "2000"]) {
    const result = gamotvale({ engineCc });
    assert.equal(result.validEngine, false);
    assert.equal(result.excise, 0);
    assert.equal(result.importDuty, 0);
  }
});

test("electric vehicle excise follows steering and selected regime", () => {
  const leftCurrent = gamotvale({ isElectric: true, steering: "left", engineCc: 0 });
  const rightCurrent = gamotvale({ isElectric: true, steering: "right", engineCc: 0 });
  const rightPrevious = gamotvale({ isElectric: true, steering: "right", engineCc: 0, preAprilRegime: true });
  assert.equal(leftCurrent.excise, 0);
  assert.equal(Object.hasOwn(leftCurrent, "registrationRestricted"), false);
  assert.equal(rightCurrent.excise, 3000);
  assert.equal(rightPrevious.excise, 1600);
});


test("hybrid reduction requires confirmed left-hand steering", () => {
  const leftHandDrive = gamotvale({ hybrid: true, steering: "left" });
  const unknownSteering = gamotvale({ hybrid: true, steering: "" });
  const missingSteering = gamotvale({ hybrid: true, steering: undefined });
  assert.ok(Math.abs(leftHandDrive.rate - 0.6) < 1e-9);
  assert.equal(unknownSteering.rate, 1.5);
  assert.equal(missingSteering.rate, 1.5);
  assert.equal(unknownSteering.excise, 3000);
  assert.equal(missingSteering.excise, 3000);
});

test("import duty applies a one-year minimum to a vehicle made in the declaration year", () => {
  const result = gamotvale({ manufactureYear: 2026, declarationYear: 2026 });
  assert.equal(result.age, 0);
  assert.equal(result.importDuty, 105);
});


test("current excise scales correctly across common engine capacities at the statutory age boundaries", () => {
  const engineCapacities = [998, 1498, 1998, 2494, 2998, 3982];
  const ageCases = [
    { age: 0, rate: 1.5 },
    { age: 6, rate: 1.5 },
    { age: 7, rate: 4.5 }
  ];

  for (const engineCc of engineCapacities) {
    for (const { age, rate } of ageCases) {
      const result = gamotvale({
        manufactureYear: 2026 - age,
        declarationYear: 2026,
        engineCc
      });
      assert.equal(result.rate, rate, `rate for ${engineCc} cm³ at age ${age}`);
      assert.equal(result.excise, engineCc * rate, `excise for ${engineCc} cm³ at age ${age}`);
    }
  }
});

test("Article 197(6) import-duty formula scales across engine sizes and age boundaries", () => {
  const engineCapacities = [998, 1498, 1998, 2494, 2998, 3982];
  const ages = [0, 1, 6, 7, 10, 15, 30];

  for (const engineCc of engineCapacities) {
    for (const age of ages) {
      const result = gamotvale({
        manufactureYear: 2026 - age,
        declarationYear: 2026,
        engineCc
      });
      const expected = engineCc * 0.05 * (1 + Math.max(1, age) * 0.05);
      assert.ok(
        Math.abs(result.importDuty - expected) < 1e-9,
        `import duty for ${engineCc} cm³ at age ${age}: expected ${expected}, received ${result.importDuty}`
      );
    }
  }
});

test("previous-regime rate table keeps its full age and upper-bound transitions", () => {
  const expectedRates = [
    1.5, 1.5, 1.5, 1.4, 1.2, 1.0, 0.8, 0.8,
    0.8, 0.9, 1.1, 1.3, 1.5, 1.8, 2.1, 2.4,
    2.4, 2.4
  ];

  for (const [age, expectedRate] of expectedRates.entries()) {
    const result = gamotvale({
      manufactureYear: 2026 - age,
      declarationYear: 2026,
      preAprilRegime: true
    });
    assert.equal(result.rate, expectedRate, `previous-regime rate at age ${age}`);
  }
});
