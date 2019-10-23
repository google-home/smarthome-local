# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from m5stack import lcd, machine, buttonA, buttonB, buttonC

DISCOVERY_PACKET = b'HelloLocalHomeSDK'

COMMAND_OFF = 0x00
COMMAND_ON = 0x01
COMMAND_STOP = 0x02
COMMAND_START = 0x03
COMMAND_RESUME = 0x04
COMMAND_PAUSE = 0x05

BACKGROUND = 0x222222
WATER = 0xDDDDFF
POWER_ON = 0x00ff00
RUNNING_ON = 0xff0000
POWER_OFF = RUNNING_OFF = 0x555555
TUMBLER_ON = 0xdddddd
TUMBLER_OFF = 0xcccccc
DOOR_ON = 0xffffff
DOOR_OFF = 0xeeeeee
DOOR_BEZEL = 0x555555

class Washer(object):
  powered = False
  started = False
  paused = False
  updated = True

  def __init__(self):
    lcd.orient(lcd.LANDSCAPE_FLIP)
    lcd.clear(BACKGROUND)
    lcd.arc(160, 120, 90, 90, 0, 180, WATER, WATER)
    lcd.arc(160, 120, 90, 90, 180, 360, WATER, WATER)
    lcd.arc(160, 120, 120, 10, 0, 180, DOOR_BEZEL, DOOR_BEZEL)
    lcd.arc(160, 120, 120, 10, 180, 360, DOOR_BEZEL, DOOR_BEZEL)
    lcd.arc(160, 120, 110, 20, 0, 180, DOOR_OFF, DOOR_OFF)
    lcd.arc(160, 120, 110, 20, 180, 360, DOOR_OFF, DOOR_OFF)
    lcd.arc(160, 120, 90, 20, 0, 180, TUMBLER_OFF, TUMBLER_OFF)
    lcd.arc(160, 120, 90, 20, 180, 360, TUMBLER_OFF, TUMBLER_OFF)
    lcd.rect(300, 20, 10, 10, POWER_OFF, POWER_OFF)
    lcd.rect(280, 20, 10, 10, RUNNING_OFF, RUNNING_OFF)
    buttonC.wasPressed(self.onoff)
    buttonB.wasPressed(self.startstop)
    buttonA.wasPressed(self.pauseresume)

  @property
  def changed(self):
    updated = self.updated
    self.updated = False
    return updated

  def onoff(self):
    print('onoff button pressed')
    if self.powered:
      self.off()
    else:
      self.on()

  def startstop(self):
    print('startstop button pressed')
    if self.started:
      self.stop()
    else:
      self.start()

  def pauseresume(self):
    print('pauseresume button pressed')
    if self.paused:
      self.resume()
    else:
      self.pause()

  def on(self):
    if self.powered:
      return
    self.powered = True
    lcd.rect(300, 20, 10, 10, POWER_ON, POWER_ON)
    lcd.rect(280, 20, 10, 10, RUNNING_OFF, RUNNING_OFF)
    lcd.arc(160, 120, 110, 20, 0, 180, DOOR_ON, DOOR_ON)
    lcd.arc(160, 120, 110, 20, 180, 360, DOOR_ON, DOOR_ON)
    lcd.arc(160, 120, 90, 20, 0, 180, TUMBLER_ON, TUMBLER_ON)
    lcd.arc(160, 120, 90, 20, 180, 360, TUMBLER_ON, TUMBLER_ON)
    self.updated = True

  def off(self):
    if not self.powered:
      return
    if self.started:
      self.stop()
    self.powered = False
    lcd.rect(300, 20, 10, 10, POWER_OFF, POWER_OFF)
    lcd.rect(280, 20, 10, 10, RUNNING_OFF, RUNNING_OFF)
    lcd.arc(160, 120, 110, 20, 0, 180, DOOR_OFF, DOOR_OFF)
    lcd.arc(160, 120, 110, 20, 180, 360, DOOR_OFF, DOOR_OFF)
    lcd.arc(160, 120, 90, 20, 0, 180, TUMBLER_OFF, TUMBLER_OFF)
    lcd.arc(160, 120, 90, 20, 180, 360, TUMBLER_OFF, TUMBLER_OFF)
    self.updated = True

  def start(self):
    if not self.powered:
      return
    if self.started:
      if self.paused:
        self.resume()
      return
    self.started = True
    self.paused = False
    self.c = self.d = 0
    self.timer = machine.Timer(2)
    self.timer.init(period=20, mode=self.timer.PERIODIC, callback=self.timer_callback)
    self.updated = True

  def stop(self):
    if not self.powered:
      return
    if not self.started:
      return
    self.started = False
    self.paused = False
    self.timer.pause()
    self.timer.deinit()
    lcd.arc(160, 120, 70, 2, 0, 180, WATER, WATER)
    lcd.arc(160, 120, 70, 2, 180, 360, WATER, WATER)
    lcd.rect(280, 20, 10, 10, RUNNING_OFF, RUNNING_OFF)
    self.updated = True

  def timer_callback(self, timer):
    if not self.started:
      lcd.arc(160, 120, 70, 2, 0, 180, WATER, WATER)
      lcd.arc(160, 120, 70, 2, 180, 360, WATER, WATER)
      lcd.rect(280, 20, 10, 10, RUNNING_OFF, RUNNING_OFF)
      return

    t = (not self.paused) and 0x800 or 0x100
    cr = (self.d & t) and RUNNING_OFF or RUNNING_ON
    ca = (self.c & 0x20) and TUMBLER_ON or WATER

    lcd.rect(280, 20, 10, 10, cr, cr)
    lcd.arc(160, 120, 70, 2, self.c, self.c + 0x20, ca, ca)
    if not self.paused:
      self.c += 0x20
    self.d += 0x20

  def pause(self):
    if not self.started:
      return
    if self.paused:
      return
    self.paused = True
    self.d = 0
    self.updated = True

  def resume(self):
    if not self.started:
      return
    if not self.paused:
      return
    self.paused = False
    self.d = 0
    self.updated = True

def connect(ssid, key):
  import network
  import utime
  wlan = network.WLAN(network.STA_IF)
  wlan.active(True)
  wlan.connect(ssid, key)
  print('connecting')
  import sys
  while not wlan.isconnected():
    sys.stdout.write('.')
    utime.sleep_ms(100)
  print()
  print(wlan.ifconfig())

def loop(washer, deviceId='deviceid123', port=3311, project_id=None):
  import usocket
  s = usocket.socket(usocket.AF_INET, usocket.SOCK_DGRAM)
  s.setblocking(False)
  s.bind(('0.0.0.0', port))
  print('listening on port:', port)
  import utime
  from struct import unpack
  import urequests
  while True:
    try:
      packet, addr = s.recvfrom(32)
      print('received packet:', packet)
      if packet == DISCOVERY_PACKET:
        s.sendto(deviceId, addr)
      elif len(packet) == 1:
        (cmd,) = unpack('@B', packet)
        if cmd == COMMAND_OFF:
          print('off command received')
          washer.off()
        elif cmd == COMMAND_ON:
          print('on command received')
          washer.on()
        elif cmd == COMMAND_STOP:
          print('stop command received')
          washer.stop()
        elif cmd == COMMAND_START:
          print('start command received')
          washer.start()
        elif cmd == COMMAND_RESUME:
          print('resume command received')
          washer.resume()
        elif cmd == COMMAND_PAUSE:
          print('pause command received')
          washer.pause()
        else:
          print('unrecognized command:', cmd)
      else:
        print('unrecognized packet:', packet)
    except OSError as e:
      utime.sleep_ms(10)
    if washer.changed and project_id:
      print('reporting state update')
      result = urequests.request("POST", 'https://%s.firebaseapp.com/updatestate' % project_id, data='{"on":%s,"isRunning":%s,"isPaused":%s}' % (
          washer.powered and 'true' or 'false',
          washer.started and 'true' or 'false',
          washer.paused and 'true' or 'false'
      ), headers={'Content-Type':'application/json'}).content
      if result != b'':
        print('error reporting state update:', result)
