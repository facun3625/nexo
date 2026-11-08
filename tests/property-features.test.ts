import test from "node:test";
import assert from "node:assert/strict";
import { parseCatalogFilters, buildPublishedPropertyWhere, CATALOG_FILTER_KEYS } from "../src/lib/estate/catalog-filters";
import { propertySchema } from "../src/lib/estate/validation";

const catalogs = { propertyTypes: [], cities: [], neighborhoods: [] };

test("feature filters combine with tenant and publication scope, including explicit no", () => {
  const parsed = parseCatalogFilters({ orientation: "Norte", petsPolicy: "No permitidas", creditEligible: "false" }, CATALOG_FILTER_KEYS, catalogs);
  const where = buildPublishedPropertyWhere("tenant-a", parsed);
  assert.equal(where.tenantId, "tenant-a");
  assert.equal(where.published, true);
  assert.deepEqual(where.listings, { some: { status: "AVAILABLE" } });
  assert.equal(where.orientation, "Norte");
  assert.equal(where.petsPolicy, "No permitidas");
  assert.equal(where.creditEligible, false);
});

test("disabled, empty and invalid filters do not exclude properties with unspecified features", () => {
  for (const parsed of [
    parseCatalogFilters({ orientation: "Norte", petsPolicy: "Permitidas", creditEligible: "true" }, [], catalogs),
    parseCatalogFilters({ orientation: "invalid", petsPolicy: "invalid", creditEligible: "invalid" }, CATALOG_FILTER_KEYS, catalogs),
    parseCatalogFilters({}, CATALOG_FILTER_KEYS, catalogs),
  ]) {
    const where = buildPublishedPropertyWhere("tenant-a", parsed);
    assert.equal("orientation" in where, false);
    assert.equal("petsPolicy" in where, false);
    assert.equal("creditEligible" in where, false);
  }
});

const property = {
  code: "A", title: "Casa", propertyType: "Casa", city: "Córdoba", neighborhood: "", address: "Privada",
  ownerId: "", bedrooms: 2, bathrooms: 1, garages: 0, coveredArea: "80", totalArea: "100",
  description: "", latitude: "", longitude: "", videoUrl: "", published: true, featured: false,
  offerType: "SALE", salePrice: "", saleCurrency: "USD", saleWhatsapp: "", saleShowPrice: true,
  rentPrice: "", rentCurrency: "ARS", rentWhatsapp: "", rentShowPrice: true,
};

test("property features preserve unspecified values and distinguish yes from no", () => {
  const unspecified = propertySchema.parse(property);
  assert.equal(unspecified.orientation, null);
  assert.equal(unspecified.petsPolicy, null);
  assert.equal(unspecified.creditEligible, null);
  const specified = propertySchema.parse({ ...property, orientation: "Sudeste", petsPolicy: "Permitidas", creditEligible: "No" });
  assert.equal(specified.orientation, "Sudeste");
  assert.equal(specified.petsPolicy, "Permitidas");
  assert.equal(specified.creditEligible, false);
  assert.equal(propertySchema.parse({ ...property, creditEligible: "Sí" }).creditEligible, true);
  assert.equal(propertySchema.safeParse({ ...property, orientation: "invalid" }).success, false);
});
