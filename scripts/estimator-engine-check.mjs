import assert from "node:assert/strict";
import { calculateEstimate, formatINR } from "../src/lib/estimator-engine.ts";
import { estimatorConfig } from "../src/lib/estimator-config.ts";

const input = { service: "rent", deviceType: "business-laptop", quantity: 25, durationMonths: 12, unitCost: 1500 };
const rent = calculateEstimate(input);
assert.equal(rent.ok, true);
assert.equal(rent.monthly, 37500);
assert.equal(rent.annual, 450000);
assert.equal(rent.total, 450000);
const procure = calculateEstimate({ ...input, service: "procure", unitCost: 50000 });
assert.equal(procure.total, 1250000);
assert.equal(procure.monthly, null);
assert.equal(procure.annual, null);
const procureOmittedDuration = calculateEstimate({ service: "procure", deviceType: "business-laptop", quantity: 25, unitCost: 50000 });
assert.equal(procureOmittedDuration.ok, true);
assert.equal(procureOmittedDuration.total, 1250000);
assert.equal(calculateEstimate({ ...input, service: "procure", unitCost: 50000, durationMonths: 60 }).total, procure.total);
const manage = calculateEstimate({ ...input, service: "manage", unitCost: 250 });
assert.equal(manage.monthly, 6250);
assert.equal(manage.annual, 75000);
assert.equal(manage.total, 75000);
assert.equal(calculateEstimate({ ...input, service: "manage", quantity: 10, durationMonths: 6, unitCost: 250 }).total, 15000);
for (const service of estimatorConfig.services) {
  for (const device of estimatorConfig.devices) {
    assert.equal(calculateEstimate({ ...input, service: service.id, deviceType: device.id, unitCost: device.rates[service.id] }).ok, true);
  }
}
const maximum = calculateEstimate({ ...input, quantity: 10000, durationMonths: 60, unitCost: 1000000 });
assert.equal(maximum.total, 600000000000);
assert.ok(Number.isSafeInteger(maximum.total));
for (const quantity of [0, 1, 10000]) {
  for (const durationMonths of [1, 60]) {
    const result = calculateEstimate({ ...input, quantity, durationMonths });
    assert.equal(result.ok, true);
    assert.equal(result.total, quantity * 1500 * durationMonths);
    assert.ok(Number.isSafeInteger(result.total));
  }
}
for (const quantity of [-1, NaN, Infinity, 1.5, 10001, 1e100, "", "25", null])
  assert.equal(calculateEstimate({ ...input, quantity }).ok, false, `quantity ${quantity}`);
for (const durationMonths of [0, -1, 61, 1.5, NaN, Infinity, "", null])
  assert.equal(calculateEstimate({ ...input, durationMonths }).ok, false);
for (const service of ["unknown", "__proto__", "constructor", null])
  assert.equal(calculateEstimate({ ...input, service }).ok, false);
for (const deviceType of ["unknown", "__proto__", "constructor", null])
  assert.equal(calculateEstimate({ ...input, deviceType }).ok, false);
for (const unitCost of [0, -1, Infinity, NaN, 1000001, "", 1.005])
  assert.equal(calculateEstimate({ ...input, unitCost }).ok, false);
for (const value of [null, [], undefined, "bad"])
  assert.equal(calculateEstimate(value).ok, false);
assert.equal(calculateEstimate({ ...input, quantity: 3, unitCost: 1.5 }).monthly, 5);
assert.equal(calculateEstimate({ ...input, quantity: 3, unitCost: 1.5 }).total, 60);
assert.equal(formatINR(125000), "₹1,25,000");
for (const value of [NaN, Infinity, -1]) assert.equal(formatINR(value), "—");
console.log("PASS: F4 Rent, Procure, Manage, boundaries, invalid inputs, rounding, safe INR output.");
