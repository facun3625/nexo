import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessInquiry,
  inquiryScopeWhere,
  parseAgentPermissions,
} from "../src/lib/agent-permissions";

const own = { source: "WEB", searchCriteria: null, propertyId: "property", assignedAgentId: "agent-a" };
const other = { ...own, assignedAgentId: "agent-b" };
const search = { source: "ALERTA", searchCriteria: {}, propertyId: null, assignedAgentId: "agent-b" };

test("legacy agent accounts default to their assigned inquiries", () => {
  const permissions = parseAgentPermissions({});
  assert.equal(permissions.inquiries, "OWN");
  assert.equal(permissions.searches, "OWN");
  assert.equal(canAccessInquiry(permissions, "agent-a", own), true);
  assert.equal(canAccessInquiry(permissions, "agent-a", other), false);
});

test("all inquiries does not grant access to searches without that permission", () => {
  const permissions = parseAgentPermissions({ inquiries: "ALL", searches: "NONE" });
  assert.equal(canAccessInquiry(permissions, "agent-a", other), true);
  assert.equal(canAccessInquiry(permissions, "agent-a", search), false);
});

test("all searches can open another agent's saved search", () => {
  const permissions = parseAgentPermissions({ inquiries: "NONE", searches: "ALL" });
  assert.equal(canAccessInquiry(permissions, "agent-a", search), true);
  assert.equal(canAccessInquiry(permissions, "agent-a", own), false);
});

test("invalid permission values cannot broaden access", () => {
  const permissions = parseAgentPermissions({ inquiries: "EVERYTHING", searches: null });
  assert.equal(permissions.inquiries, "OWN");
  assert.equal(permissions.searches, "OWN");
  assert.equal(permissions.properties, "NONE");
  assert.deepEqual(inquiryScopeWhere("NONE", "agent-a"), null);
  assert.deepEqual(inquiryScopeWhere("OWN", "agent-a"), { assignedAgentId: "agent-a" });
  assert.deepEqual(inquiryScopeWhere("ALL", "agent-a"), {});
});
