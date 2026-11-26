import test from "node:test";
import assert from "node:assert/strict";
import { angarisheEmailValiduria, normalizireAngarishisEmail } from "./account-validation.mjs";

test("normalizes account email by trimming whitespace and lowercasing", () => {
  assert.equal(normalizireAngarishisEmail("  George.Pavliashvili+test@Example.COM  "), "george.pavliashvili+test@example.com");
});

test("accepts ordinary and plus-addressed email addresses", () => {
  for (const email of [
    "george@example.com",
    "first.last+tag@example.co.uk",
    "name_surname@example.ge"
  ]) {
    assert.equal(angarisheEmailValiduria(email), true, email + " should be accepted");
  }
});

test("rejects missing, malformed and whitespace-containing email addresses", () => {
  for (const email of [
    "",
    "   ",
    "not-an-email",
    "name@localhost",
    "name@@example.com",
    "first last@example.com",
    "name@example .com"
  ]) {
    assert.equal(angarisheEmailValiduria(email), false, email + " should be rejected");
  }
});

test("rejects non-string values and email addresses over 254 characters", () => {
  assert.equal(angarisheEmailValiduria(null), false);
  assert.equal(angarisheEmailValiduria(undefined), false);
  assert.equal(angarisheEmailValiduria({ email: "george@example.com" }), false);
  assert.equal(angarisheEmailValiduria("a".repeat(246) + "@example.com"), false);
});

test("validates the normalized form accepted by the account endpoints", () => {
  const email = normalizireAngarishisEmail("  GEORGE@EXAMPLE.COM ");
  assert.equal(angarisheEmailValiduria(email), true);
  assert.equal(email, "george@example.com");
});
