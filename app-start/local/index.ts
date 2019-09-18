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
    // TODO: Implement device identification
  }

  executeHandler(request: IntentFlow.ExecuteRequest):
      Promise<IntentFlow.ExecuteResponse> {
    // TODO: Implement local execution
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
