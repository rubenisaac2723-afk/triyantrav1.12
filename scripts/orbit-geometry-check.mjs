import assert from "node:assert/strict";
import {
  formatCoord,
  formatPercent,
  orbitNodeGeometry,
  ORBIT_COORD_PRECISION,
} from "../src/lib/orbit-geometry.ts";

const ANGLES = [0, 60, 120, 180, 240, 300];
const STAGE = 480;
const RING = STAGE * 0.42;
const NODE_PCT = 37;
const ANGLE_RAD = /^\d+\.\d{4}%$/;
const COORD_RAD = /^\d+\.\d{4}$/;
const num = Number;

assert.equal(ORBIT_COORD_PRECISION, 4);

for (const angle of ANGLES) {
  // 1. Two independent calls produce identical output (hydration determinism)
  const a = orbitNodeGeometry(angle, STAGE, RING, NODE_PCT);
  const b = orbitNodeGeometry(angle, STAGE, RING, NODE_PCT);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

  // 2. Canonical formatting: fixed 4-decimal precision, percent suffix on left/top
  assert.match(a.x2, COORD_RAD, `x2 canonical for ${angle}`);
  assert.match(a.y2, COORD_RAD, `y2 canonical for ${angle}`);
  assert.match(a.left, ANGLE_RAD, `left canonical for ${angle}`);
  assert.match(a.top, ANGLE_RAD, `top canonical for ${angle}`);
  // 2b. Formatter round-trips
  assert.equal(a.left, formatPercent(num(a.left.slice(0, -1))), `left formatter round-trips for ${angle}`);
  assert.equal(a.top, formatPercent(num(a.top.slice(0, -1))), `top formatter round-trips for ${angle}`);

  // 3. Finite, no NaN/Infinity
  for (const v of [a.x2, a.y2, a.left, a.top]) {
    assert.ok(Number.isFinite(num(v.replace("%", ""))), `finite for ${angle}`);
  }

  // 4. Whole-circle closure: start angle (0) must equal end angle (360) geometry
  const zero = orbitNodeGeometry(0, STAGE, RING, NODE_PCT);
  const full = orbitNodeGeometry(360, STAGE, RING, NODE_PCT);
  assert.deepEqual(
    JSON.parse(JSON.stringify(zero)),
    JSON.parse(JSON.stringify(full)),
  );

  // 5. Symmetry: 60° vs -300°, 120° vs -240° ... produce identical geometry
  const neg = orbitNodeGeometry(angle - 360, STAGE, RING, NODE_PCT);
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(neg)),
    `angle wraps: ${angle} == ${angle - 360}`,
  );
}

// 6. formatCoord stable across repeated calls and matches expected rounding
assert.equal(formatCoord(31.999999999999982), "32.0000");
assert.equal(formatCoord(65.40927859705721), "65.4093");
assert.equal(formatCoord(65.40927859705724), "65.4093");
assert.equal(formatCoord(50), "50.0000");
assert.equal(formatPercent(31.499999999999982), "31.5000%");
assert.equal(formatPercent(87.00000000000001), "87.0000%");

// 7. Known-good geometry spot checks at 0° and 180°
const proc = orbitNodeGeometry(0, STAGE, RING, NODE_PCT);
assert.equal(proc.left, "87.0000%");
assert.equal(proc.top, "50.0000%");
const support = orbitNodeGeometry(180, STAGE, RING, NODE_PCT);
assert.equal(support.left, "13.0000%");
assert.equal(support.top, "50.0000%");

console.log("[ORBIT-GEOMETRY CHECK] PASS: deterministic, canonical, finite.");