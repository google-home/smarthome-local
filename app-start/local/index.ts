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

const SERVER_PORT = 3311;

enum Command {
  Off = 0x00,
  On = 0x01,
  Stop = 0x02,
  Start = 0x03,
  Resume = 0x04,
  Pause = 0x05,
};

interface IWasherParams {
  on?: boolean,
  start?: boolean,
  pause?: boolean,
}

class LocalExecutionApp {

  constructor(private readonly app: App) { }

  identifyHandler(request: IntentFlow.IdentifyRequest):
      Promise<IntentFlow.IdentifyResponse> {
    // TODO: Implement device identification
  }

  executeHandler(request: IntentFlow.ExecuteRequest):
      Promise<IntentFlow.ExecuteResponse> {
    // TODO: Implement local execution
  }

  /**
   * Convert execution request into a local device command
   */
  getDataForCommand(command: string, params: IWasherParams): Uint8Array {
    switch (command) {
      case 'action.devices.commands.OnOff':
        return new Uint8Array([params.on ? Command.On : Command.Off]);
      case 'action.devices.commands.StartStop':
        return new Uint8Array([params.start ? Command.Start : Command.Stop]);
      case 'action.devices.commands.PauseUnpause':
        return new Uint8Array([params.pause ? Command.Pause : Command.Resume]);
      default:
        throw new Error(`Unknown command: ${command}`);
    };
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
