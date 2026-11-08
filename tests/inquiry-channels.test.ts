import test from "node:test";
import assert from "node:assert/strict";
import { inquiryChannelFor, parseInquiryChannel } from "../src/lib/estate/inquiry-channels";

test("AI inquiries stay in AI even when tied to a property or search", () => {
  assert.equal(inquiryChannelFor({ source: "AI_AGENT", propertyId: "p", searchCriteria: {} }), "ai");
});
test("legacy alerts and structured searches are both searches", () => {
  assert.equal(inquiryChannelFor({ source: "ALERTA", propertyId: null, searchCriteria: null }), "searches");
  assert.equal(inquiryChannelFor({ source: "ADMIN", propertyId: "p", searchCriteria: {} }), "searches");
});
test("property and general inquiries do not mix", () => {
  assert.equal(inquiryChannelFor({ source: "WEB", propertyId: "p", searchCriteria: null }), "property");
  assert.equal(inquiryChannelFor({ source: "WEB", propertyId: null, searchCriteria: null }), "general");
});
test("unknown channel cannot produce an unrestricted inbox", () => {
  assert.equal(parseInquiryChannel("all"), "property");
  assert.equal(parseInquiryChannel(undefined), "property");
  assert.equal(parseInquiryChannel("ai"), "ai");
});
