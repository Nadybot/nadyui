<template>
  <div class="row pl-3">
    <div class="w-25 overflow-auto module-container">
      <ul class="list-group">
        <li
          v-for="module in modules"
          :key="module.name"
          @click="selectModule(module)"
          class="list-group-item d-flex justify-content-between align-items-center module-item"
          :class="{ active: selected && module.name == selected.name }"
          :title="module.description ? module.description.split('.')[0] : ''"
        >
          {{ module.name }}
          <div
            class="form-check form-switch form-switch-md form-switch-right mb-0"
          >
            <input
              class="form-check-input mt-0"
              type="checkbox"
              @click="toggleModule(module)"
              :checked="
                module.num_commands_disabled + module.num_events_disabled == 0
              "
              :indeterminate.prop="
                module.num_commands_disabled + module.num_events_disabled > 0 &&
                module.num_commands_enabled + module.num_events_enabled > 0
              "
              :class="{
                'border-lightblue': selected && module.name == selected.name,
              }"
            />
          </div>
        </li>
      </ul>
    </div>
    <div class="w-75 px-3 overflow-auto setting-container" v-if="selected">
      <h1 class="mb-3">{{ selected.name }}</h1>

      <div v-if="selected.description" class="callout callout-info mb-3">
        <p v-html="renderDescription(selected.description)"></p>
      </div>

      <div v-if="selected_settings.length > 0">
        <div class="card w-100">
          <div class="card-header">Settings</div>
          <ul class="list-group list-group-flush">
            <li
              class="list-group-item setting-item"
              v-for="setting in selected_settings"
              :key="setting.name"
            >
              <div class="col-9 fake-section">
                {{ setting.description }}

                <template v-if="setting.help">
                  <div
                    :id="'popover-target-' + setting.name"
                    class="d-inline-block"
                  >
                    <fa icon="question-circle" :invert="60"></fa>
                  </div>
                  <popover
                    :target="'popover-target-' + setting.name"
                    triggers="click"
                  >
                    <template #title>{{ setting.name }}</template>
                    <ao-message
                      :content="parseXml(setting.help)"
                      @run-command="runCommand($event)"
                    ></ao-message>
                  </popover>
                </template>

                <span class="custom-muted ml-5">{{ setting.name }}</span>
              </div>

              <div class="col-3 fake-section right">
                <input
                  v-if="setting.type == 'number'"
                  type="number"
                  class="form-control form-control-sm"
                  v-model.number="setting.value"
                  @change="changeSetting(setting)"
                />

                <div
                  v-if="setting.type == 'bool'"
                  class="form-check form-switch form-switch-md form-switch-right"
                >
                  <input
                    class="form-check-input mt-0"
                    type="checkbox"
                    v-model="setting.value"
                    @change="changeSetting(setting)"
                  />
                </div>

                <select
                  v-if="
                    setting.type == 'options' ||
                    setting.type == 'discord_channel'
                  "
                  class="form-select form-select-sm"
                  v-model="setting.value"
                  @change="changeSetting(setting)"
                >
                  <option
                    v-for="option in setting.options"
                    :key="option.name"
                    :value="option.value"
                  >
                    {{ option.name }}
                  </option>
                </select>

                <select
                  v-if="setting.type == 'int_options'"
                  class="form-select form-select-sm"
                  v-model.number="setting.value"
                  @change="changeSetting(setting)"
                >
                  <option
                    v-for="option in setting.options"
                    :key="option.name"
                    :value="option.value"
                  >
                    {{ option.name }}
                  </option>
                </select>

                <select
                  v-if="setting.type == 'rank'"
                  class="form-select form-select-sm"
                  v-model="setting.value"
                  @change="changeSetting(setting)"
                >
                  <option
                    v-for="access_level in access_levels"
                    :key="access_level.name"
                    :disabled="!access_level.enabled"
                    :value="access_level.value"
                  >
                    {{ access_level.name }}
                  </option>
                </select>

                <input-options
                  v-if="setting.type == 'text'"
                  type="text"
                  v-model="setting.value"
                  @change="changeSetting(setting)"
                  :options="setting.options"
                />

                <template v-if="setting.type == 'color'">
                  <input
                    v-if="setting.type == 'color'"
                    type="color"
                    class="form-control form-control-sm color-input"
                    :value="findColorFromTag(setting.value)"
                    :list="setting.name + '-datalist'"
                    @input="(e) => (setting.value = e.target.value)"
                    @change="changeSetting(setting)"
                  />
                  <datalist :id="setting.name + '-datalist'">
                    <option
                      v-for="option in setting.options"
                      :key="option.name"
                      :label="option.name"
                      :value="option.value"
                    ></option>
                  </datalist>
                </template>

                <time-picker
                  v-if="setting.type == 'time'"
                  v-model="setting.value"
                  @change="changeSetting(setting)"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-3" v-if="selected_events.length > 0">
        <div class="card w-100">
          <div class="card-header">Events</div>
          <ul class="list-group list-group-flush">
            <li
              class="list-group-item d-flex justify-content-between align-items-center event-item"
              v-for="event in selected_events"
              :key="event.event"
            >
              <span
                >{{ event.description }}
                <span class="custom-muted ml-5">{{ event.event }}</span></span
              >
              <div
                class="form-check form-switch form-switch-md form-switch-right mb-0"
              >
                <input
                  class="form-check-input mt-0"
                  type="checkbox"
                  v-model="event.enabled"
                  @change="toggleEvent(event)"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-3" v-if="selected_commands.length > 0">
        <table class="table table-bordered table-hover">
          <thead>
            <tr class="table-head-light">
              <th scope="col" class="text-nowrap">Command</th>
              <th scope="col" class="desc">Description</th>
              <th
                v-for="permission_set in selected_commands[0].permissions"
                :key="permission_set.name"
              >
                {{ titleCase(permission_set.permission_set) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="command in selected_commands" :key="command.cmd">
              <tr>
                <td
                  :class="{
                    'pad-left': command.subcommands.length == 0,
                    clickable: command.subcommands.length > 0,
                  }"
                  @click="selectCommand(command)"
                >
                  <fa
                    v-if="command.subcommands.length > 0"
                    :icon="
                      selected_command && command.cmd == selected_command.cmd
                        ? 'chevron-down'
                        : 'chevron-right'
                    "
                    :invert="10"
                  ></fa>
                  {{ command.cmd }}
                </td>
                <td>{{ command.description }}</td>
                <td
                  v-for="permission_set in command.permissions"
                  :key="permission_set.name"
                >
                  <div class="input-group">
                    <div class="input-group-text">
                      <input
                        type="checkbox"
                        :value="permission_set.enabled"
                        v-model="permission_set.enabled"
                        @change="toggleCommand(command, permission_set)"
                      />
                    </div>
                    <select
                      class="form-select form-select-sm"
                      v-model="permission_set.access_level"
                      @change="toggleCommand(command, permission_set)"
                    >
                      <option
                        v-for="access_level in access_levels"
                        :key="access_level.name"
                        :selected="
                          access_level.value == permission_set.access_level
                        "
                        :disabled="!access_level.enabled"
                        :value="access_level.value"
                      >
                        {{ access_level.name }}
                      </option>
                    </select>
                  </div>
                </td>
              </tr>

              <template
                v-if="selected_command && command.cmd == selected_command.cmd"
              >
                <tr
                  v-for="subcommand in command.subcommands"
                  :key="subcommand.cmd"
                >
                  <td class="pad-left border-left-thick">
                    {{ subcommand.cmd }}
                  </td>
                  <td>{{ subcommand.description }}</td>
                  <td
                    v-for="permission_set in subcommand.permissions"
                    :key="permission_set.name"
                  >
                    <div class="input-group">
                      <div class="input-group-text">
                        <input
                          type="checkbox"
                          :value="permission_set.enabled"
                          v-model="permission_set.enabled"
                          @change="toggleCommand(subcommand, permission_set)"
                        />
                      </div>
                      <select
                        class="form-select form-select-sm"
                        v-model="permission_set.access_level"
                        @change="toggleCommand(subcommand, permission_set)"
                      >
                        <option
                          v-for="access_level in access_levels"
                          :key="access_level.name"
                          :selected="
                            access_level.value == permission_set.access_level
                          "
                          :disabled="!access_level.enabled"
                          :value="access_level.value"
                        >
                          {{ access_level.name }}
                        </option>
                      </select>
                    </div>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <h2 class="pl-3 w-75" v-else>
      Select a module to change its configuration.
    </h2>
  </div>
</template>

<style lang="scss" scoped>
.custom-muted {
  display: none;
  color: lighten(#6c757d, 20%);
}

.setting-item .fa-icon {
  margin-right: 5px;
}

.event-item:hover,
.setting-item:hover {
  .custom-muted {
    display: inline;
  }
}

.module-item:hover:not(.active) {
  color: white;
  background-color: rgba(0, 123, 255, 0.9);
}

.table-head-light {
  background-color: rgba(0, 0, 0, 0.03);
}

.table td,
.table.th {
  vertical-align: middle;
}

.module-container {
  height: 96vh;
}

.setting-container {
  height: 98vh;
}

.fake-section {
  display: inline-block;
  padding: 0;
}

.right {
  text-align: right;
}

.color-input {
  min-height: 0;
  height: 1.6em;
}

.pad-left {
  padding-left: 30px;
}

.pad-left-2 {
  padding-left: 60px;
}

td {
  white-space: nowrap;
}

.border-left-thick {
  border-left: 3px solid #424242;
}

td.clickable:hover,
.module-item:hover {
  cursor: pointer;
}

.form-switch-right {
  display: inline;

  input {
    position: absolute;
    right: 1rem;
  }
}

.border-lightblue:checked {
  border: 1px solid #88b1d5;
}
</style>

<script lang="ts">
import { defineComponent, nextTick } from "vue";
import { mapActions, mapMutations } from "vuex";

import {
  getModules,
  getModuleSettings,
  getModuleEvents,
  getModuleCommands,
  getAccessLevels,
  toggleModule,
  toggleEvent,
  toggleCommand,
  changeSetting,
} from "@/nadybot/http";
import {
  ConfigModule,
  ModuleAccessLevel,
  ModuleCommand,
  ModuleEventConfig,
  ModuleSetting,
  PermissionSet,
} from "@/nadybot/types/settings";
import { parseXml } from "@/nadybot/message";

interface SettingsData {
  access_levels: Array<ModuleAccessLevel>;
  modules: Array<ConfigModule>;
  selected: ConfigModule | null;
  selected_settings: Array<ModuleSetting>;
  selected_commands: Array<ModuleCommand>;
  selected_events: Array<ModuleEventConfig>;
  selected_command: ModuleCommand | null;
}

export default defineComponent({
  name: "Settings",

  methods: {
    titleCase: function (input: string): string {
      return `${input.charAt(0).toUpperCase()}${input.slice(1)}`;
    },
    getClassForModule: function (module: ConfigModule): string {
      if (
        module.num_commands_disabled == 0 &&
        module.num_events_disabled == 0
      ) {
        return "all";
      } else if (
        module.num_commands_disabled + module.num_events_disabled > 0 &&
        module.num_commands_enabled + module.num_events_enabled > 0
      ) {
        return "some";
      } else {
        return "none";
      }
    },
    renderDescription: function (desc: string): string {
      const text = desc.replaceAll("\n\n", "<br>");
      const urlRegex =
        /(\b(https?|ftp|file):\/\/([-A-Z0-9+&@#%?=~_|!:,.;]*)([-A-Z0-9+&@#%?/=~_|!:,.;]*)[-A-Z0-9+&@#/%=~_|])/gi;
      return text.replace(urlRegex, "<a href='$1' target='_blank'>$1</a>");
    },
    selectModule: async function (module: ConfigModule): Promise<void> {
      let settings = await getModuleSettings(module.name);
      settings = settings.filter(function (val) {
        return val.editable == true;
      });
      const commands = await getModuleCommands(module.name);
      const events = await getModuleEvents(module.name);

      this.selected_settings = settings;
      this.selected_commands = commands;
      this.selected_events = events;
      this.selected = module;
      await nextTick();
    },
    findColorFromTag: function (text: string): string | null {
      const re = /#[0-9a-f]{3,6}/i;
      const matches = text.match(re);
      if (matches) {
        return matches[0];
      }
      return null;
    },
    selectCommand: function (command: ModuleCommand): void {
      if (this.selected_command && this.selected_command.cmd == command.cmd) {
        this.selected_command = null;
      } else {
        this.selected_command = command;
      }
    },
    toggleModule: async function (module: ConfigModule): Promise<void> {
      const enabled = !(
        module.num_commands_disabled + module.num_events_disabled ==
        0
      );
      await toggleModule(module.name, enabled);
      await this.reloadModules();

      if (this.selected && this.selected.name == module.name) {
        await this.selectModule(module);
      }

      if (module.name == "RAID_MODULE") {
        await this.reloadAccessLevels();
      }
    },
    toggleEvent: async function (event: ModuleEventConfig): Promise<void> {
      if (this.selected) {
        await toggleEvent(
          this.selected.name,
          event.event,
          event.handler,
          event.enabled
        );

        await this.reloadModules();
      }
    },
    toggleCommand: async function (
      command: ModuleCommand,
      config: PermissionSet
    ): Promise<void> {
      if (this.selected) {
        await toggleCommand(
          this.selected.name,
          command.cmd,
          config.permission_set,
          config.access_level,
          config.enabled
        );

        if (this.selected.name == "RAID_MODULE") {
          await this.reloadAccessLevels();
        }

        await this.reloadModules();
      }
    },
    changeSetting: async function (setting: ModuleSetting): Promise<void> {
      if (this.selected) {
        await changeSetting(this.selected.name, setting.name, setting.value);

        if (this.selected.name == "RAID_MODULE") {
          await this.reloadAccessLevels();
        } else if (this.selected.name == "DISCORD") {
          this.selected_settings = await getModuleSettings(this.selected.name);
        }
      }
    },
    reloadAccessLevels: async function (): Promise<void> {
      const access_levels = await getAccessLevels();
      access_levels.sort(function (a, b) {
        return a.numeric_value - b.numeric_value;
      });
      this.access_levels = access_levels;
    },
    reloadModules: async function (): Promise<void> {
      this.modules = await getModules();
    },
    parseXml: function (body: string): XMLDocument {
      return parseXml(body);
    },
    runCommand: async function (command: string): Promise<void> {
      // Soft wrapper for executeCommand with history integration
      this.addConsoleHistoryEntry(command);
      await this.executeCommand(command);
    },
    ...mapActions(["executeCommand"]),
    ...mapMutations(["addConsoleHistoryEntry"]),
  },

  data(): SettingsData {
    return {
      access_levels: [],
      modules: [],
      selected: null,
      selected_settings: [],
      selected_commands: [],
      selected_events: [],
      selected_command: null,
    };
  },

  async created() {
    const modules = await getModules();
    const access_levels = await getAccessLevels();
    access_levels.sort(function (a, b) {
      return a.numeric_value - b.numeric_value;
    });
    console.log(
      `Loaded ${modules.length} modules and ${access_levels.length} access levels`
    );
    this.modules = modules;
    this.access_levels = access_levels;
  },
});
</script>
