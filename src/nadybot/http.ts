import { OnlinePlayers, onlinePlayersDecoder } from "./types/player";
import { SystemInformation, systemInformationDecoder } from "./types/stats";
import {
  ConfigModule,
  ModuleSetting,
  moduleSettingArrayDecoder,
  configModuleArrayDecoder,
  ModuleEventConfig,
  moduleEventConfigArrayDecoder,
  ModuleCommand,
  moduleCommandArrayDecoder,
  ModuleAccessLevel,
  moduleAccessLevelArrayDecoder,
} from "./types/settings";

// any is safe since we can JSON.stringify it
// eslint-disable-next-line
async function putJson(url: string, json: any): Promise<Response> {
  return await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });
}

// any is safe since we can JSON.stringify it
// eslint-disable-next-line
async function postJson(url: string, json: any): Promise<Response> {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });
}

export async function getOnlineMembers(): Promise<OnlinePlayers> {
  const response = await fetch("/api/online");
  if (response.status == 403) {
    throw new Error("cannot fetch online members");
  }
  const json = await response.json();
  return await onlinePlayersDecoder.decodeToPromise(json);
}

export async function getSystemInformation(): Promise<SystemInformation> {
  const response = await fetch("/api/sysinfo");
  const json = await response.json();
  return await systemInformationDecoder.decodeToPromise(json);
}

export async function getModules(): Promise<Array<ConfigModule>> {
  const response = await fetch("/api/module");
  const json = await response.json();
  return await configModuleArrayDecoder.decodeToPromise(json);
}

export async function getModuleSettings(
  moduleName: string
): Promise<Array<ModuleSetting>> {
  const response = await fetch(`/api/module/${moduleName}/settings`);
  const json = await response.json();
  return await moduleSettingArrayDecoder.decodeToPromise(json);
}

export async function getModuleEvents(
  moduleName: string
): Promise<Array<ModuleEventConfig>> {
  const response = await fetch(`/api/module/${moduleName}/events`);
  const json = await response.json();
  return await moduleEventConfigArrayDecoder.decodeToPromise(json);
}

export async function getModuleCommands(
  moduleName: string
): Promise<Array<ModuleCommand>> {
  const response = await fetch(`/api/module/${moduleName}/commands`);
  const json = await response.json();
  return await moduleCommandArrayDecoder.decodeToPromise(json);
}

export async function getAccessLevels(): Promise<Array<ModuleAccessLevel>> {
  const response = await fetch("/api/access_levels");
  const json = await response.json();
  return await moduleAccessLevelArrayDecoder.decodeToPromise(json);
}

export async function toggleModule(
  name: string,
  enabled: boolean
): Promise<void> {
  const op = enabled ? "enable" : "disable";
  await putJson(`/api/module/${name}`, { op: op });
}

export async function toggleEvent(
  module: string,
  name: string,
  handler: string,
  enabled: boolean
): Promise<void> {
  const op = enabled ? "enable" : "disable";
  await putJson(`/api/module/${module}/events/${name}/${handler}`, {
    op: op,
  });
}

export async function toggleCommand(
  module: string,
  name: string,
  channel: string,
  access_level: string,
  enabled: boolean
): Promise<void> {
  const encoded_command_name = encodeURIComponent(name);
  await putJson(
    `/api/module/${module}/commands/${encoded_command_name}/${channel}`,
    {
      access_level: access_level,
      enabled: enabled,
    }
  );
}

export async function changeSetting(
  module: string,
  name: string,
  value: string | number | boolean | null
): Promise<void> {
  await putJson(`/api/module/${module}/settings/${name}`, value);
}

export async function executeCommand(
  uuid: string,
  command: string
): Promise<void> {
  await postJson(`/api/execute/${uuid}`, command);
}

export async function sendMessage(
  channel: "priv" | "org",
  text: string
): Promise<void> {
  await postJson(`/api/chat/${channel}`, text);
}
