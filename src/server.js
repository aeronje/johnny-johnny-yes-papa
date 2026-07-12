"use strict";

const path = require("node:path");
const express = require("express");
const { evaluateLie } = require("./evaluate-lie");
const { LedController } = require("./led-controller");

const HTTP_PORT = Number(process.env.PORT || 3000);
const SERIAL_PORT = process.env.ARDUINO_PORT || "/dev/ttyUSB0";

const app = express();
const leds = new LedController({ port: SERIAL_PORT });
let server;
let shuttingDown = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/status", (_request, response) => {
  response.json({
    boardReady: leds.ready,
    serialPort: SERIAL_PORT,
  });
});

app.post("/api/evaluate", (request, response) => {
  if (!leds.ready) {
    return response.status(503).json({ error: "Board is not ready" });
  }

  try {
    const result = evaluateLie(request.body);
    leds.setLieStatus(result.liesPositive);
    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}; turning both LEDs off.`);
  leds.off();

  if (server) {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 2000).unref();
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

leds.connect()
  .then(() => {
    console.log(`UNO ready on ${SERIAL_PORT}; both LEDs are off.`);
    server = app.listen(HTTP_PORT, "0.0.0.0", () => {
      console.log(`API listening on http://0.0.0.0:${HTTP_PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to initialize the UNO:", error);
    process.exit(1);
  });
