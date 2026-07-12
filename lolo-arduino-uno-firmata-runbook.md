# Lolo Arduino UNO Clone + Firmata Runbook

Date completed: 2026-07-12 (MNL)

Target host: `aeronje@192.168.137.99`

Board identity: unknown-manufacturer Arduino UNO R3-compatible clone

Detected USB bridge: `1a86:7523 QinHeng HL-340` (CH340/CH341 family)

Serial port: `/dev/ttyUSB0`

## Final verified state

- Host OS: Ubuntu 20.04 family, kernel `5.15.0-139-generic`
- Kernel modules: `ch341`, `usbserial`
- Arduino CLI: `1.5.1`
- Arduino AVR Boards core: `1.8.8`
- Firmata Arduino library: `2.5.9`
- Servo Arduino library: `1.3.0`
- Selected board FQBN: `arduino:avr:uno`
- Blink compile/upload: successful
- StandardFirmata compile/upload: successful
- Live Firmata protocol response: `2.5`
- Live firmware response: `2.5 StandardFirmata.ino`

## 1. Initial USB and system inspection

These commands established that Linux detected the clone's CH340-compatible USB-to-serial bridge and attached it to `/dev/ttyUSB0`.

```bash
hostname
uname -a
lsusb -d 1a86:7523
lsmod | grep -E '^ch341|^usbserial' || true
ls -l /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || true

for d in /dev/ttyUSB* /dev/ttyACM*; do
  if [ -e "$d" ]; then
    echo "DEVICE=$d"
    udevadm info --query=property --name="$d" 2>/dev/null \
      | grep -E '^(DEVNAME|ID_VENDOR_ID|ID_MODEL_ID|ID_VENDOR=|ID_MODEL=|ID_SERIAL=|ID_USB_DRIVER=)' \
      || true
  fi
done

id
command -v fuser >/dev/null \
  && fuser -v /dev/ttyUSB* /dev/ttyACM* 2>/dev/null \
  || true

command -v arduino-cli || true
command -v arduino || true
command -v arduino-ide || true
arduino-cli version 2>/dev/null || true

dpkg-query -W -f='${binary:Package}\t${Version}\n' 2>/dev/null \
  | grep -Ei 'arduino|avrdude|firmata' \
  || true

journalctl -k -n 100 --no-pager 2>/dev/null \
  | grep -Ei 'ch341|ttyUSB|1a86|7523' \
  | tail -n 30 \
  || true
```

Important results:

```text
ID_USB_DRIVER=ch341
/dev/ttyUSB0
ch341-uart converter now attached to ttyUSB0
```

## 2. Grant serial-port access

This was the only required elevated command. It was run manually by Pogi:

```bash
sudo usermod -aG dialout aeronje
getent group dialout
```

Expected group result:

```text
dialout:x:20:aeronje
```

Start a fresh login or SSH session after changing group membership. Verify access:

```bash
id
ls -l /dev/ttyUSB0
test -r /dev/ttyUSB0 && echo READ_OK
test -w /dev/ttyUSB0 && echo WRITE_OK
```

## 3. Install Arduino CLI without sudo

Arduino CLI was installed only for the current user under `~/.local/bin`.

```bash
mkdir -p "$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"

if ! command -v arduino-cli >/dev/null 2>&1; then
  curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh \
    | BINDIR="$HOME/.local/bin" sh
fi

arduino-cli version
```

Installed result:

```text
arduino-cli 1.5.1
```

The installer obtains the current CLI release. For strict reproduction, archive this runbook and replace the generic installer invocation with a pinned Arduino CLI release when rebuilding another machine.

## 4. Install the UNO AVR toolchain

```bash
export PATH="$HOME/.local/bin:$PATH"
arduino-cli core update-index
arduino-cli core install arduino:avr
arduino-cli core list
arduino-cli board list
```

Installed result:

```text
arduino:avr 1.8.8
```

The CH340 clone appears as an unknown serial board in automatic discovery. This is expected because the USB bridge does not advertise an official Arduino board identity. Use the UNO FQBN explicitly:

```text
arduino:avr:uno
```

## 5. Blink smoketest

Create a sketch directory named `Blink` containing `Blink.ino`:

```cpp
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
```

The sketch used during this session was stored at:

```text
$HOME/arduino-smoketest/Blink/Blink.ino
```

Compile and upload:

```bash
export PATH="$HOME/.local/bin:$PATH"

arduino-cli compile \
  --fqbn arduino:avr:uno \
  "$HOME/arduino-smoketest/Blink"

arduino-cli upload \
  -p /dev/ttyUSB0 \
  --fqbn arduino:avr:uno \
  "$HOME/arduino-smoketest/Blink"
```

Successful compile result:

```text
Sketch uses 924 bytes (2%) of program storage space.
Global variables use 9 bytes (0%) of dynamic memory.
New upload port: /dev/ttyUSB0 (serial)
```

## 6. Install and upload StandardFirmata

Install Firmata:

```bash
export PATH="$HOME/.local/bin:$PATH"
arduino-cli lib install Firmata
arduino-cli lib list | grep -i Firmata
```

Firmata `2.5.9` required `Servo.h`. The first compile stopped with:

```text
fatal error: Servo.h: No such file or directory
```

Install the official Servo dependency:

```bash
arduino-cli lib install Servo
```

Compile and upload StandardFirmata:

```bash
arduino-cli compile \
  --fqbn arduino:avr:uno \
  "$HOME/Arduino/libraries/Firmata/examples/StandardFirmata"

arduino-cli upload \
  -p /dev/ttyUSB0 \
  --fqbn arduino:avr:uno \
  "$HOME/Arduino/libraries/Firmata/examples/StandardFirmata"
```

Successful result:

```text
Sketch uses 13142 bytes (40%) of program storage space.
Global variables use 1083 bytes (52%) of dynamic memory.
New upload port: /dev/ttyUSB0 (serial)
```

Uploading another sketch later will replace StandardFirmata. Re-run the upload command above to restore it.

## 7. Live Firmata handshake test

The test script was copied to:

```text
$HOME/arduino-smoketest/firmata_probe.py
```

Run it with:

```bash
python3 "$HOME/arduino-smoketest/firmata_probe.py"
```

Verified response:

```text
PROTOCOL_VERSION=2.5
FIRMWARE=2.5 StandardFirmata.ino
```

This proves the board is not only flashable as an UNO; StandardFirmata is running and answering protocol queries over `/dev/ttyUSB0` at 57600 baud.

## Operational notes

- Keep USB connected while the host application controls the board through Firmata.
- Avoid using pins `0` (RX) and `1` (TX) for ordinary components while using USB serial communication.
- Only one host process should hold `/dev/ttyUSB0` at a time.
- Disconnect external wiring before uncertain uploads or pin experiments.
- The installed Firmata firmware is ready, but the final host-side client library depends on the application language (Python, Node.js, Java, and so on).

## Session execution notes

- An early combined SSH probe failed because PowerShell-to-Bash quoting produced an unmatched quote. It made no remote configuration change.
- An early installer call was interrupted by the desktop shell's short execution timeout. A later idempotent installation confirmed that Arduino CLI was absent, then completed the installation cleanly.
- No system package installation was required.
- No elevated command was run by Donna; Pogi manually ran the single `sudo usermod` command.
