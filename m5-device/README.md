# MicroPython washer device

This project contains an optional washer device implementation based on the
[M5Stack Core](https://m5stack.com/) IoT development kit.

## Prerequisites

- Follow the [offical instructions](https://github.com/m5stack/M5Stack_MicroPython#simple-build-instructions)
  to build the MicroPython firmware for the M5Stack and flash it onto the device.
- Install the [VCP serial drivers](https://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers)
  for the M5Stack USB to UART converter.

## Deploy the MicroPython application

1. Discover the serial port name of the device on your local machine:
   - Linux: `ls /dev/ttyUSB*`
   - Mac: `ls /dev/{tty,cu}.*`

1. Install the `adafruit-ampy` Python utility
    ```
    python3 -m venv env
    env/bin/python -m pip install --upgrade setuptools pip wheel
    env/bin/python -m pip install adafruit-ampy
    ```

1. Deploy the application to the device
    ```
    export AMPY_PORT=<serial-port-name>
    env/bin/ampy put boot.py /flash/boot.py
    env/bin/ampy put washer.py /flash/washer.py
    ```

## Start the UDP server

The local washer UI starts automatically when the device boots.
Connect to the device over serial to connect to WiFi and start the local
UDP server.

```
screen /dev/ttyUSB0
>>> connect('my-ssid', 'my-password') # connect to WiFi
>>> loop(washer, 'deviceid123', 3311, 'project-id') # start networking loop
```
> Note: If the colors on the washer display are inverted, use the following
command to correct them: `lcd.tft_writecmd(0x21)`