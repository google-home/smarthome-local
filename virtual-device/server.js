/**
 * Copyright 2019, Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const dgram = require('dgram');
const logger = require('./logger');

const COMMAND_OFF = 0x00;
const COMMAND_ON = 0x01;
const COMMAND_STOP = 0x02;
const COMMAND_START = 0x03;
const COMMAND_RESUME = 0x04;
const COMMAND_PAUSE = 0x05;

const Washer = require('./washer');
const argv = require(`yargs`)
  .options({
    deviceId: {
      description: 'Local device id.',
      requiresArg: true,
      demandOption: true,
      type: 'string',
    },
    projectId: {
      description: 'Google Actions project id.',
      requiresArg: true,
      demandOption: true,
      type: 'string',
    },
    discoveryPacket: {
      description: 'Data packet to expect in UDP broadcasts.',
      requiresArg: true,
      demandOption: true,
      type: 'string',
    },
    udpPort: {
      description: 'Port to listen for UDP broadcast and commands.',
      requiresArg: true,
      demandOption: true,
      type: 'number',
    },
  })
  .example(
    `$0 \\\n\t--deviceId=deviceid123 --projectId=blue-jet-123 \\\n\t--discoveryPacket=HelloLocalHomeSDK --udpPort=3311`
  )
  .wrap(120)
  .help()
  .strict().argv;

// Create a washer device
const virtualDevice = new Washer(argv.projectId);

// Start the UDP server
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
  logger.info(`Got [${msg.toString('hex')}] from ${rinfo.address}`);

  if (msg == argv.discoveryPacket) {
    udpServer.send(argv.deviceId, rinfo.port, rinfo.address, () => {
      logger.info(`Done sending [${argv.deviceId}] to ${rinfo.address}:${
      rinfo.port}`);
      logger.info(
          `Check console logs on your device via chrome://inspect.`);
      logger.info(
          `You should see IDENTIFY intent response with verificationId set to ${
      argv.deviceId}`);
    });
  } else if (msg.length === 1) {
    const cmd = msg[0];
    switch (cmd) {
      case COMMAND_OFF:
        virtualDevice.off();
        break;
      case COMMAND_ON:
        virtualDevice.on();
        break;
      case COMMAND_STOP:
        virtualDevice.stop();
        break;
      case COMMAND_START:
        virtualDevice.start();
        break;
      case COMMAND_RESUME:
        virtualDevice.resume();
        break;
      case COMMAND_PAUSE:
        virtualDevice.pause();
        break;
      default:
        logger.error(`unsupported command: ${cmd}`);
        break;
    }
  } else {
    logger.error(`unrecognized message: ${msg.toString('hex')}`);
  }
});

udpServer.on('error', (err) => {
  logger.error(`UDP Server error: ${err.message}`);
});

udpServer.on('listening', () => {
  logger.info(`UDP Server listening on ${argv.udpPort}`);
});

// Outbound port for Home device = the port the smart home device should
// listen to
udpServer.bind(argv.udpPort);
