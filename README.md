# Tech content

[▶ Download Johnny Johnny Final](https://github.com/aeronje/johnny-johnny-yes-papa/raw/refs/heads/main/johnnyJohnnyFinal.mp4)

# Johnny Johnny Yes Papa

Backend-first proof of concept that evaluates two lyric answers and maps the
result to LEDs attached to a Firmata-ready Arduino UNO-compatible board.

I intentionally included node_modules so that it is a lot easier. Apologies for the garbage.

## Tested setup and portability

This POC was tested on a private local network, not as a public internet
service. Values such as `192.168.137.99`, `/dev/ttyUSB0`, port `3000`, the
`192.168.136.0/23` home subnet, and the `aeronje` account are specific to the
test environment. Match the host address, serial-device path, firewall rule,
user account, and subnet to your own machine and network.

The verified board is an unknown-manufacturer Arduino UNO R3-compatible
ATmega328P clone. Its USB interface identifies as `1a86:7523 QinHeng HL-340`,
from the CH340/CH341 family. Do not assume that boards using a different
microcontroller, USB bridge, bootloader, serial path, or Linux distribution
require identical setup steps.

For the exact Arduino CLI, AVR core, USB permission, Blink, and StandardFirmata
procedure used on this hardware, see the
[Lolo Arduino UNO Clone + Firmata Runbook](./lolo-arduino-uno-firmata-runbook.md).

## Hardware mapping

- Red LED: digital pin 8 through a 1 kOhm resistor
- Green LED: digital pin 9 through a 1 kOhm resistor
- Board serial port: `/dev/ttyUSB0`
- Arduino Firmata library installed: 2.5.9
- Live protocol/firmware response: StandardFirmata 2.5

## Logic

The known story fact is that Johnny is eating sugar. The only completely
truthful sequence is `eatingSugar: true` followed by `tellingLies: false`.
That result lights green. Any exchange containing a lie lights red.

## Runtime

This project was tested with Node.js 24.16.0 and npm 11.13.0. If Node is
managed through NVM, load Node 24 before npm or Node commands:

```bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 24
node -v
```

Install and test:

```bash
npm install
npm test
```

Start the board-backed API:

```bash
npm start
```

The project explicitly binds `firmata-io` to modern `serialport` rather than
using Johnny-Five's optional legacy SerialPort 8 dependency. This keeps the
transport compatible with Node 24 on Lolo's Ubuntu 20.04 installation.

Open the POC page from another device on Lolo's LAN:

```text
http://192.168.137.99:3000/
```

The page sends both dropdown selections to `POST /api/evaluate`. Node derives
`liesPositive`, Johnny-Five maps it to the LEDs, and the JSON response updates
the result text in the browser.
