import test from "node:test";
import assert from "node:assert/strict";
import {
  sheqmeniAshshPotiSheTavazebebi,
  gamotvaleCopartisKharjebi,
  gadaiyvaneUsdGelshi,
  diapazonisShualedi
} from "./cost-estimator.mjs";

test("converts USD using the supplied live NBG rate without hardcoding a rate", () => {
  assert.equal(gadaiyvaneUsdGelshi(100, 2.5), 250);
  assert.equal(gadaiyvaneUsdGelshi(-1, 2.5), null);
  assert.equal(gadaiyvaneUsdGelshi(100, 0), null);
});

test("calculates Copart non-clean secured live-bid fees from the public standard schedule", () => {
  const result = gamotvaleCopartisKharjebi({
    bidUsd: 500,
    titleType: "nonClean",
    paymentType: "secured",
    bidType: "live"
  });
  assert.deepEqual(result, {
    buyerFee: 205,
    virtualBidFee: 65,
    gateFee: 95,
    environmentalFee: 15,
    total: 380
  });
});

test("calculates clean-title and pre-bid fee variations", () => {
  const clean = gamotvaleCopartisKharjebi({
    bidUsd: 500,
    titleType: "clean",
    paymentType: "secured",
    bidType: "preBid"
  });
  assert.equal(clean.buyerFee, 185);
  assert.equal(clean.virtualBidFee, 55);
  assert.equal(clean.gateFee, 95);
  assert.equal(clean.environmentalFee, 15);
  assert.equal(clean.total, 350);
});

test("uses the published flat virtual-bid fee for bids above the upper table bands", () => {
  const result = gamotvaleCopartisKharjebi({ bidUsd: 12000, titleType: "nonClean", paymentType: "secured", bidType: "live" });
  assert.equal(result.virtualBidFee, 160);
  assert.equal(result.gateFee, 95);
  assert.equal(result.environmentalFee, 15);
  assert.equal(result.total, 1270);
});

test("rejects invalid auction prices", () => {
  assert.equal(gamotvaleCopartisKharjebi({ bidUsd: -5 }), null);
  assert.equal(gamotvaleCopartisKharjebi({ bidUsd: Number.NaN }), null);
});

test("returns midpoint of a public route range", () => {
  assert.equal(diapazonisShualedi({ min: 1500, max: 2400 }), 1950);
});

test("builds USD and GEL transport estimates but leaves unsupported prices blank", () => {
  const suggestions = sheqmeniAshshPotiSheTavazebebi({
    purchaseUsd: null,
    usdToGel: 2.5,
    shippingMethod: "sharedContainer",
    pickupAtPoti: false
  });
  assert.equal(suggestions.valuesUsd.purchase, null);
  assert.equal(suggestions.valuesUsd.auction, null);
  assert.equal(suggestions.valuesUsd.inland, 537.5);
  assert.equal(suggestions.valuesUsd.shipping, 1950);
  assert.equal(suggestions.valuesUsd.port, 350);
  assert.equal(suggestions.valuesUsd.delivery, null);
  assert.equal(suggestions.valuesGel.shipping, 4875);
});

test("estimates insurance and Copart charges when a sourced auction price exists", () => {
  const suggestions = sheqmeniAshshPotiSheTavazebebi({
    purchaseUsd: 10000,
    usdToGel: 2.5,
    shippingMethod: "sharedContainer",
    titleType: "nonClean",
    paymentType: "secured",
    bidType: "live",
    pickupAtPoti: true,
    auctionPlatform: "copart"
  });
  assert.equal(suggestions.valuesUsd.purchase, 10000);
  assert.equal(suggestions.valuesUsd.insurance, 20);
  assert.ok(suggestions.valuesUsd.auction > 0);
  assert.equal(suggestions.valuesUsd.delivery, 0);
});

test("does not apply Copart buyer fees to IAAI auction sales", () => {
  const suggestions = sheqmeniAshshPotiSheTavazebebi({
    purchaseUsd: 5000,
    usdToGel: 2.5,
    auctionPlatform: "iaai"
  });
  assert.equal(suggestions.valuesUsd.auction, null);
});

test("own-container and RoRo routes do not invent separate Poti charges from the shared-container tariff", () => {
  const roro = sheqmeniAshshPotiSheTavazebebi({ purchaseUsd: null, usdToGel: 2.5, shippingMethod: "roro" });
  const own = sheqmeniAshshPotiSheTavazebebi({ purchaseUsd: null, usdToGel: 2.5, shippingMethod: "ownContainer" });
  assert.equal(roro.valuesUsd.port, null);
  assert.equal(own.valuesUsd.port, null);
});

test("does not calculate Copart buyer fees without a known clean/non-clean title group", () => {
  assert.equal(gamotvaleCopartisKharjebi({ bidUsd: 500, titleType: "unknown" }), null);
  const suggestions = sheqmeniAshshPotiSheTavazebebi({ purchaseUsd: 500, usdToGel: 2.5, titleType: "unknown" });
  assert.equal(suggestions.valuesUsd.auction, null);
});

test("uses the published non-clean unsecured fee from the $6,000 band", () => {
  const result = gamotvaleCopartisKharjebi({
    bidUsd: 6000,
    titleType: "nonClean",
    paymentType: "unsecured",
    bidType: "live"
  });
  assert.equal(result.buyerFee, 1085);
  assert.equal(result.virtualBidFee, 145);
  assert.equal(result.gateFee, 95);
  assert.equal(result.environmentalFee, 15);
  assert.equal(result.total, 1340);
});

test("uses the published upper Copart virtual-bid bands for pre-bid and live bids", () => {
  const preBid = gamotvaleCopartisKharjebi({ bidUsd: 7000, titleType: "nonClean", paymentType: "secured", bidType: "preBid" });
  const liveBid = gamotvaleCopartisKharjebi({ bidUsd: 9000, titleType: "nonClean", paymentType: "secured", bidType: "live" });
  assert.equal(preBid.virtualBidFee, 125);
  assert.equal(liveBid.virtualBidFee, 160);
});
