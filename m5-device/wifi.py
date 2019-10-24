import network
import sys
import utime

def connect(ssid, key):
  wlan = network.WLAN(network.STA_IF)
  wlan.active(True)
  wlan.connect(ssid, key)
  print('connecting')
  while not wlan.isconnected():
    sys.stdout.write('.')
    utime.sleep_ms(100)
  print()
  print(wlan.ifconfig())
