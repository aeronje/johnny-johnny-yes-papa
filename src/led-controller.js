"use strict";

const { Board, Led } = require("johnny-five");
const bindFirmataTransport = require("firmata-io");
const { SerialPort } = require("serialport");

// firmata-io 2.x expects the SerialPort 8 constructor signature
// (path, options). Adapt modern SerialPort 13 without pulling in the legacy
// native bindings that Johnny-Five lists as optional dependencies.
class SerialPortTransport extends SerialPort {
  constructor(path, options = {}) {
    super({ path, ...options });
  }
}

const Firmata = bindFirmataTransport(SerialPortTransport);

class LedController {
  constructor({ port = "/dev/ttyUSB0", redPin = 8, greenPin = 9 } = {}) {
    this.port = port;
    this.redPin = redPin;
    this.greenPin = greenPin;
    this.board = null;
    this.red = null;
    this.green = null;
    this.ready = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const io = new Firmata(this.port);

      this.board = new Board({
        io,
        repl: false,
        debug: true,
      });

      this.board.once("ready", () => {
        this.red = new Led(this.redPin);
        this.green = new Led(this.greenPin);
        this.off();
        this.ready = true;
        resolve();
      });

      this.board.once("error", reject);
      this.board.once("fail", reject);
    });
  }

  setLieStatus(liesPositive) {
    if (!this.ready) {
      throw new Error("Board is not ready");
    }
    if (typeof liesPositive !== "boolean") {
      throw new TypeError("liesPositive must be a boolean");
    }

    if (liesPositive) {
      this.green.off();
      this.red.on();
    } else {
      this.red.off();
      this.green.on();
    }
  }

  off() {
    this.red?.off();
    this.green?.off();
  }
}

module.exports = { LedController };
