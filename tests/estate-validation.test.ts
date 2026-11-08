import test from "node:test";
import assert from "node:assert/strict";
import {
  amount,
  chargeSchema,
  contractSchema,
  parseDate,
  propertySchema,
  visitSchema,
} from "../src/lib/estate/validation";

test("money rejects negative, zero, exponential and overprecision inputs", () => {
  for (const value of ["-1", "0", "1e3", "12.001", "NaN", ""])
    assert.equal(amount.safeParse(value).success, false, value);
  assert.equal(amount.parse("1234.56"), "1234.56");
});
test("visits interpret Argentine late-night times without rejecting the UTC date change", () => {
  assert.equal(
    parseDate("2026-10-01T23:30", true).toISOString(),
    "2026-10-02T02:30:00.000Z",
  );
  assert.throws(() => parseDate("2026-02-30"));
  const visit = {
    propertyId: "a",
    contactId: "b",
    agentName: "Ana",
    startsAt: "2026-10-01T10:00",
    endsAt: "2026-10-01T09:00",
    status: "SCHEDULED",
    notes: "",
  };
  assert.equal(visitSchema.safeParse(visit).success, false);
});
test("an obligation belongs to exactly one contract or unit", () => {
  const base = {
    contractId: "",
    unitId: "",
    concept: "Alquiler",
    period: "2026-10",
    dueAt: "2026-10-10",
    amount: "100",
    currency: "ARS",
  };
  assert.equal(chargeSchema.safeParse(base).success, false);
  assert.equal(
    chargeSchema.safeParse({ ...base, contractId: "c", unitId: "u" }).success,
    false,
  );
  assert.equal(
    chargeSchema.safeParse({ ...base, contractId: "c" }).success,
    true,
  );
  assert.equal(
    chargeSchema.safeParse({ ...base, unitId: "u", period: "2026-13" }).success,
    false,
  );
});
test("contracts require valid chronological dates", () => {
  const base = {
    reference: "A",
    propertyId: "a",
    contactId: "b",
    startsAt: "2026-10-10",
    endsAt: "2026-10-09",
    amount: "100",
    currency: "ARS",
    status: "ACTIVE",
    adjustmentNotes: "",
    notes: "",
  };
  assert.equal(contractSchema.safeParse(base).success, false);
  assert.equal(
    contractSchema.safeParse({ ...base, endsAt: "2027-10-10" }).success,
    true,
  );
});
test("public properties require an offer and consistent surfaces", () => {
  const p = {
    code: "A",
    title: "Casa",
    propertyType: "Casa",
    city: "Córdoba",
    neighborhood: "",
    address: "Privada",
    ownerId: "",
    developmentId: "",
    bedrooms: "2",
    bathrooms: "1",
    garages: "0",
    coveredArea: "80",
    totalArea: "100",
    description: "",
    published: true,
    featured: false,
    saleEnabled: false,
    salePrice: "",
    saleCurrency: "USD",
    rentEnabled: false,
    rentPrice: "",
    rentCurrency: "ARS",
  };
  assert.equal(propertySchema.safeParse(p).success, false);
  assert.equal(
    propertySchema.safeParse({ ...p, saleEnabled: true }).success,
    true,
  );
  assert.equal(
    propertySchema.safeParse({ ...p, saleEnabled: true, coveredArea: "120" })
      .success,
    false,
  );
});
