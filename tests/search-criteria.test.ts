import test from "node:test";
import assert from "node:assert/strict";
import { searchCriteriaSchema, matchingPropertyWhere, matchingListingWhere, describeSearch } from "../src/lib/estate/search-criteria";

test("all selected criteria intersect and preserve tenant/publication/availability boundaries", () => {
  const criteria = searchCriteriaSchema.parse({ city: "Ciudad sin stock", propertyType: "Casa", bedrooms: "0", bathrooms: "2", petsPolicy: "Permitidas", creditEligible: "false", orientation: "Norte", operation: "RENT", maxBudget: "500000", currency: "ARS" });
  assert.deepEqual(matchingPropertyWhere("tenant-a", criteria), {
    tenantId: "tenant-a", published: true,
    city: "Ciudad sin stock", propertyType: "Casa", bedrooms: 0, bathrooms: 2,
    petsPolicy: "Permitidas", creditEligible: false, orientation: "Norte",
    listings: { some: { status: "AVAILABLE", operation: "RENT", temporary: false, currency: "ARS", price: { lte: "500000" } } },
  });
});

test("budget, currency and operation constrain the same listing", () => {
  const criteria = searchCriteriaSchema.parse({ operation: "SALE", maxBudget: "100000.50", currency: "USD" });
  assert.deepEqual(matchingListingWhere(criteria), { status: "AVAILABLE", operation: "SALE", temporary: false, currency: "USD", price: { lte: "100000.50" } });
});

test("temporary daily rentals never match monthly searches", () => {
  assert.equal(matchingListingWhere(searchCriteriaSchema.parse({ operation: "RENT" })).temporary, false);
  assert.equal(matchingListingWhere(searchCriteriaSchema.parse({})).temporary, false);
  assert.deepEqual(matchingListingWhere(searchCriteriaSchema.parse({ operation: "RENT_TEMP" })), { status: "AVAILABLE", operation: "RENT", temporary: true });
});

test("indifferent criteria add no requirements and no implicit budget", () => {
  const where = matchingPropertyWhere("tenant-a", searchCriteriaSchema.parse({}));
  assert.deepEqual(where, { tenantId: "tenant-a", published: true, listings: { some: { status: "AVAILABLE", temporary: false } } });
});

test("reject ambiguous money, negative amounts, invalid currencies and fractional room counts", () => {
  for (const maxBudget of ["USD 100.000", "100.000", "-1", "0", "1e5", "1,50", "Infinity"]) assert.equal(searchCriteriaSchema.safeParse({ maxBudget }).success, false, maxBudget);
  assert.equal(searchCriteriaSchema.safeParse({ currency: "EUR" }).success, false);
  assert.equal(searchCriteriaSchema.safeParse({ bedrooms: "1.5" }).success, false);
  assert.equal(searchCriteriaSchema.safeParse({ petsPolicy: "maybe" }).success, false);
});

test("criteria JSON round trip retains explicit no and zero", () => {
  const criteria = searchCriteriaSchema.parse({ bedrooms: "0", creditEligible: "false", petsPolicy: "No permitidas" });
  const restored = searchCriteriaSchema.parse(JSON.parse(JSON.stringify(criteria)));
  assert.deepEqual(restored, criteria);
  assert.ok(describeSearch(restored).includes("No apto crédito"));
  assert.ok(describeSearch(restored).includes("0 dormitorios (exactos)"));
});
