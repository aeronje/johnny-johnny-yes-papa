"use strict";

const form = document.querySelector("#lyrics-form");
const result = document.querySelector("#result");
const resultCopy = result.querySelector(".status-copy");
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    eatingSugar: formData.get("eatingSugar") === "true",
    tellingLies: formData.get("tellingLies") === "true",
  };

  submitButton.disabled = true;
  result.dataset.light = "pending";
  resultCopy.textContent = "Checking Johny...";

  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to evaluate Johny");
    }

    result.dataset.light = data.light;
    resultCopy.textContent = data.liesPositive
      ? "Johny told a lie. Red light."
      : "Johny told the truth. Green light.";
  } catch (error) {
    result.dataset.light = "error";
    resultCopy.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
