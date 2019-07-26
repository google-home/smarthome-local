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

/// <reference types="@google/local-home-sdk" />

import App = smarthome.App;
import Constants = smarthome.Constants;
import DataFlow = smarthome.DataFlow;
import Execute = smarthome.Execute;
import Intents = smarthome.Intents;
import IntentFlow = smarthome.IntentFlow;

const SERVER_PORT = 3388;

interface IWasherParams {
  on?: boolean,
  start?: boolean,
  pause?: boolean,
}

class LocalExecutionApp {

  constructor(private readonly app: App) { }

  identifyHandler(request: IntentFlow.IdentifyRequest):
      Promise<IntentFlow.IdentifyResponse> {
    console.log("IDENTIFY intent: " + JSON.stringify(request, null, 2));

    const scanData = request.inputs[0].payload.device.udpScanData;
    if (!scanData) {
      const err = new IntentFlow.HandlerError(request.requestId, 'invalid_request', 'Invalid scan data');
      return Promise.reject(err);
    }

    // In this codelab, the scan data contains only local device id.
    const localDeviceId = Buffer.from(scanData, 'hex');

    const response: IntentFlow.IdentifyResponse = {
      intent: Intents.IDENTIFY,
      requestId: request.requestId,
      payload: {
        device: {
          id: 'washer',
          verificationId: localDeviceId.toString(),
        }
      }
    };
    console.log("IDENTIFY response: " + JSON.stringify(response, null, 2));

    return Promise.resolve(response);
  }

  executeHandler(request: IntentFlow.ExecuteRequest):
      Promise<IntentFlow.ExecuteResponse> {
    console.log("EXECUTE intent: " + JSON.stringify(request, null, 2));

    const command = request.inputs[0].payload.commands[0];
    const execution = command.execution[0];
    const response = new Execute.Response.Builder()
      .setRequestId(request.requestId);

    const promises: Array<Promise<void>> = command.devices.map((device) => {
      console.log("Handling EXECUTE intent for device: " + JSON.stringify(device));

      // Convert execution params to a string for the local device
      const params = execution.params as IWasherParams;
      const payload = this.getDataForCommand(execution.command, params);

      // Create a command to send over the local network
      const radioCommand = new DataFlow.HttpRequestData();
      radioCommand.requestId = request.requestId;
      radioCommand.deviceId = device.id;
      radioCommand.data = JSON.stringify(payload);
      radioCommand.dataType = 'application/json';
      radioCommand.port = SERVER_PORT;
      radioCommand.method = Constants.HttpOperation.POST;
      radioCommand.isSecure = false;

      console.log("Sending HTTP request to the smart home device:", payload);

      return this.app.getDeviceManager()
        .send(radioCommand)
        .then(() => {
          const state = {online: true};
          response.setSuccessState(device.id, Object.assign(state, params));
          console.log(`Command successfully sent to ${device.id}`);
        })
        .catch((e: IntentFlow.HandlerError) => {
          e.errorCode = e.errorCode || 'invalid_request';
          response.setErrorState(device.id, e.errorCode);
          console.error('An error occurred sending the command', e.errorCode);
        });
    });

    return Promise.all(promises)
      .then(() => {
        return response.build();
      })
      .catch((e) => {
        const err = new IntentFlow.HandlerError(request.requestId, 'invalid_request', e.message);
        return Promise.reject(err);
      });
  }

  /**
   * Convert execution request into a local device command
   */
  getDataForCommand(command: string, params: IWasherParams): unknown {
    switch (command) {
      case 'action.devices.commands.OnOff':
        return {
          on: params.on ? true : false
        };
      case 'action.devices.commands.StartStop':
        return {
          isRunning: params.start ? true : false
        };
      case 'action.devices.commands.PauseUnpause':
        return {
          isPaused: params.pause ? true : false
        };
      default:
        console.error('Unknown command', command);
        return {};
    }
  }
}

const localHomeSdk = new App('1.0.0');
const localApp = new LocalExecutionApp(localHomeSdk);
localHomeSdk
  .onIdentify(localApp.identifyHandler.bind(localApp))
  .onExecute(localApp.executeHandler.bind(localApp))
  .listen()
  .then(() => console.log('Ready'))
  .catch((e: Error) => console.error(e));
