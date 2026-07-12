"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateLie } = require("../src/evaluate-lie");

const cases = [
  {
    name: "truthful about eating sugar and truthful about not lying",
    input: { eatingSugar: true, tellingLies: false },
    liesPositive: false,
    light: "green",
  },
  {
    name: "truthful about sugar but falsely claims to be lying",
    input: { eatingSugar: true, tellingLies: true },
    liesPositive: true,
    light: "red",
  },
  {
    name: "lies about sugar and then admits the lie",
    input: { eatingSugar: false, tellingLies: true },
    liesPositive: true,
    light: "red",
  },
  {
    name: "lies about sugar and denies lying",
    input: { eatingSugar: false, tellingLies: false },
    liesPositive: true,
    light: "red",
  },
];

for (const entry of cases) {
  test(entry.name, () => {
    const result = evaluateLie(entry.input);
    assert.equal(result.liesPositive, entry.liesPositive);
    assert.equal(result.light, entry.light);
  });
}

test("rejects non-boolean answers", () => {
  assert.throws(
    () => evaluateLie({ eatingSugar: "yes", tellingLies: false }),
    /must both be booleans/
  );
});
