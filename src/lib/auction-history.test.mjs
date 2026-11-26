import test from "node:test";
import assert from "node:assert/strict";
import {
  sheadareManqanebisIdentoba,
  gaarchieAuqcionisIstoria
} from "./auction-history.mjs";

const vin = "5UXKR0C52G0P21189";

test("normalizes the API Auctions v3 vehicle and history response", () => {
  const result = gaarchieAuqcionisIstoria({
    vin,
    make: "BMW",
    model: "X5",
    year: 2016,
    series: "F15",
    trim: "xDrive35i",
    body_class: "SUV",
    history: [{
      auction: "copart",
      lot_number: "40365342",
      sold_at: "2024-08-12",
      final_bid: 4200,
      currency: "USD",
      odometer: 86134,
      title: "salvage",
      photos: ["https://cdn.copart.com/photo1.jpg"]
    }, {
      auction: "emirates",
      lot_number: "12345678",
      sold_at: "2022-04-13",
      sale_price: 3900,
      currency: "AED",
      final_bid: 3850,
      title: "rebuilt"
    }]
  }, vin);

  assert.equal(result.kind, "found");
  assert.deepEqual(result.vehicle, {
    vin,
    make: "BMW",
    model: "X5",
    year: 2016,
    series: "F15",
    trim: "xDrive35i",
    bodyClass: "SUV"
  });
  assert.equal(result.history[0].price, 4200);
  assert.equal(result.history[0].priceType, "final-bid");
  assert.equal(result.history[0].priceCurrency, "USD");
  assert.equal(result.history[0].saleDate, "2024-08-12");
  assert.equal(result.history[0].lotNumber, "40365342");
  assert.equal(result.history[0].odometer, 86134);
  assert.equal(result.history[0].titleType, "salvage");
  assert.deepEqual(result.history[0].photos, ["https://cdn.copart.com/photo1.jpg"]);
  assert.equal(result.history[1].price, 3900);
  assert.equal(result.history[1].priceType, "sale-price");
  assert.equal(result.history[1].priceCurrency, "AED");
  assert.equal(result.history[1].titleType, "rebuilt");
  assert.equal(result.historyTruncated, false);
});

test("defaults an omitted provider currency to USD but rejects malformed currency codes", () => {
  const result = gaarchieAuqcionisIstoria({
    vin,
    history: [
      { auction: "Copart", final_bid: 1000 },
      { auction: "Emirates", final_bid: 1000, currency: "US dollars" }
    ]
  }, vin);

  assert.equal(result.history[0].priceCurrency, "USD");
  assert.equal(result.history[1].priceCurrency, null);
});

test("normalizes the legacy v1 envelope during migration", () => {
  const result = gaarchieAuqcionisIstoria({
    result: true,
    data: {
      vin,
      make: "BMW",
      model: "X5",
      year: 2016,
      history: [{
        auction: "Copart",
        lot_number: 40365342,
        sale_date: "2024-08-12",
        sale_status: "Sold",
        final_bid: 4200,
        odometer: 86134,
        primary_damage: "Front End",
        secondary_damage: "Suspension",
        title_type: "Salvage",
        location: "FL — Tampa South",
        photos: ["https://cdn.copart.com/photo1.jpg"]
      }]
    }
  }, vin);

  assert.equal(result.kind, "found");
  assert.equal(result.history[0].price, 4200);
  assert.equal(result.history[0].priceType, "final-bid");
  assert.equal(result.history[0].priceCurrency, "USD");
  assert.equal(result.history[0].saleDate, "2024-08-12");
  assert.equal(result.history[0].lotNumber, "40365342");
  assert.equal(result.history[0].odometer, 86134);
  assert.equal(result.history[0].primaryDamage, "Front End");
  assert.equal(result.history[0].titleType, "Salvage");
  assert.deepEqual(result.history[0].photos, ["https://cdn.copart.com/photo1.jpg"]);
});

test("returns no-history only when the provider explicitly returns an empty history array", () => {
  const result = gaarchieAuqcionisIstoria({
    vin,
    make: "BMW",
    model: "X5",
    year: 2016,
    history: []
  }, vin);
  assert.equal(result.kind, "no-history");
  assert.deepEqual(result.history, []);
  assert.ok(result.vehicle);
});

test("rejects a successful response with a missing or malformed history field", () => {
  assert.equal(gaarchieAuqcionisIstoria({ vin }, vin), null);
  assert.equal(gaarchieAuqcionisIstoria({ vin, history: null }, vin), null);
  assert.equal(gaarchieAuqcionisIstoria({ vin, history: {} }, vin), null);
});

test("rejects a history array containing malformed auction entries", () => {
  assert.equal(gaarchieAuqcionisIstoria({
    vin,
    history: [{ auction: "Copart", final_bid: 1200 }, null]
  }, vin), null);
});

test("rejects a response for a different VIN", () => {
  assert.equal(gaarchieAuqcionisIstoria({
    vin: "WDDGF8AB1EA960217",
    history: [{ final_bid: 4200 }]
  }, vin), null);
});

test("rejects malformed provider responses", () => {
  assert.equal(gaarchieAuqcionisIstoria(null, vin), null);
  assert.equal(gaarchieAuqcionisIstoria({ result: false, data: {} }, vin), null);
  assert.equal(gaarchieAuqcionisIstoria({ vin: 123, history: [] }, vin), null);
  assert.equal(gaarchieAuqcionisIstoria({ result: true, data: [] }, vin), null);
  assert.equal(gaarchieAuqcionisIstoria({ result: true, data: { history: [] } }, vin), null);
});

test("does not turn missing, negative or malformed prices into zero-dollar sales", () => {
  const result = gaarchieAuqcionisIstoria({
    vin,
    history: [
      { auction: "Copart", final_bid: -2 },
      { auction: "IAAI", final_bid: "not a price" },
      { auction: "Copart" }
    ]
  }, vin);
  assert.equal(result.history[0].price, null);
  assert.equal(result.history[0].priceType, null);
  assert.equal(result.history[1].price, null);
  assert.equal(result.history[2].price, null);
});

test("rejects unsafe photo schemes and malformed sale dates", () => {
  const result = gaarchieAuqcionisIstoria({
    vin,
    history: [{
      auction: "Copart",
      sold_at: "2024-02-31",
      final_bid: 1000,
      photos: ["javascript:alert(1)", "http://example.com/photo.jpg", "https://cdn.copart.com/photo.jpg"]
    }]
  }, vin);
  assert.equal(result.history[0].saleDate, null);
  assert.deepEqual(result.history[0].photos, ["https://cdn.copart.com/photo.jpg"]);
});

test("keeps up to the provider's documented 24 photos per sale", () => {
  const photos = Array.from({ length: 30 }, (_, index) => `https://cdn.example.com/${index + 1}.jpg`);
  const result = gaarchieAuqcionisIstoria({
    vin,
    history: [{ auction: "Copart", final_bid: 1000, photos }]
  }, vin);
  assert.equal(result.history[0].photos.length, 24);
  assert.equal(result.history[0].photos[23], "https://cdn.example.com/24.jpg");
});

test("does not interpret null auction prices or odometer values as zero", () => {
  const result = gaarchieAuqcionisIstoria({
    vin,
    history: [{
      auction: "Copart",
      final_bid: null,
      sale_price: null,
      odometer: null
    }]
  }, vin);
  assert.equal(result.history[0].price, null);
  assert.equal(result.history[0].priceType, null);
  assert.equal(result.history[0].odometer, null);
});

test("flags more auction events when provider returns a next-page cursor", () => {
  const result = gaarchieAuqcionisIstoria({
    vin,
    history: [{ auction: "Copart", final_bid: 1000 }],
    next_page: "cursor-next"
  }, vin);
  assert.equal(result.historyTruncated, true);
});

test("flags more auction events when the provider returns more than the display limit", () => {
  const history = Array.from({ length: 31 }, (_, index) => ({
    auction: "Copart",
    lot_number: String(index + 1),
    final_bid: 1000
  }));
  const result = gaarchieAuqcionisIstoria({ vin, history }, vin);
  assert.equal(result.history.length, 30);
  assert.equal(result.historyTruncated, true);
});

test("compares the technical VIN identity with the auction identity", () => {
  const decoded = {
    make: "MERCEDES-BENZ",
    model: "C-Class",
    modelYear: 2014,
    trim: "C300 4MATIC"
  };
  const matching = {
    make: "Mercedes-Benz",
    model: "C300",
    year: 2014
  };
  const mismatched = {
    make: "Mercedes-Benz",
    model: "S550",
    year: 2014
  };

  assert.deepEqual(sheadareManqanebisIdentoba(decoded, matching), []);
  assert.equal(sheadareManqanebisIdentoba(decoded, mismatched).length, 1);
  assert.match(sheadareManqanebisIdentoba(decoded, mismatched)[0], /Model:/);
});

test("reports make and year conflicts independently", () => {
  const mismatches = sheadareManqanebisIdentoba(
    { make: "BMW", model: "X5", modelYear: 2016 },
    { make: "Mercedes-Benz", model: "S550", year: 2014 }
  );
  assert.equal(mismatches.length, 3);
  assert.ok(mismatches.some((item) => item.startsWith("Make:")));
  assert.ok(mismatches.some((item) => item.startsWith("Year:")));
  assert.ok(mismatches.some((item) => item.startsWith("Model:")));
});

test("flags the C-Class versus S550 mismatch from the public sandbox fixture", () => {
  const mismatches = sheadareManqanebisIdentoba(
    {
      make: "MERCEDES-BENZ",
      model: "C-Class",
      modelYear: 2014,
      trim: "C300 4 MATIC"
    },
    {
      make: "Mercedes-Benz",
      model: "S550",
      year: 2014
    }
  );
  assert.equal(mismatches.length, 1);
  assert.match(mismatches[0], /Model:/);
});

test("does not treat neighboring model codes as compatible substrings", () => {
  const mismatches = sheadareManqanebisIdentoba(
    { make: "Mercedes-Benz", model: "C-Class", modelYear: 2014, trim: "C200" },
    { make: "MERCEDES BENZ", model: "C2000", year: 2014 }
  );
  assert.equal(mismatches.length, 1);
  assert.match(mismatches[0], /Model:/);
});

test("accepts punctuation variants of the same manufacturer name", () => {
  assert.deepEqual(
    sheadareManqanebisIdentoba(
      { make: "MERCEDES-BENZ", model: "C-Class", modelYear: 2014 },
      { make: "Mercedes Benz", model: "C-Class", year: 2014 }
    ),
    []
  );
});
