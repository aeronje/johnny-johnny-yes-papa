"use strict";

function evaluateLie({ eatingSugar, tellingLies }) {
  if (typeof eatingSugar !== "boolean" || typeof tellingLies !== "boolean") {
    throw new TypeError("eatingSugar and tellingLies must both be booleans");
  }

  const actuallyEatingSugar = true;
  const firstLie = eatingSugar !== actuallyEatingSugar;
  const secondLie = tellingLies !== firstLie;
  const liesPositive = firstLie || secondLie;

  return {
    firstLie,
    secondLie,
    liesPositive,
    light: liesPositive ? "red" : "green",
  };
}

module.exports = { evaluateLie };
