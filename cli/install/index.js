const chalk = require("chalk");
const { prompt, registerPrompt } = require("inquirer");
const promptAutocomplete = require("inquirer-autocomplete-prompt");
const { hri } = require("human-readable-ids");
const { memoize, identity } = require("lodash");
const { command, debug, task, highlight } = require("../utils");
const { installMinecraft } = require("../../lib/minecraft/api/download");
const { installInstanceFromPath } = require("../../lib/minecraft/api/instance");
const { startInstance } = require("../../lib/minecraft/api/instance/process");
const { searchModpacks } = require("../../lib/curse/api/search");
// TODO: Don't depend on page API directly
const { projectFilesPage } = require("../../lib/curse/api/page");
const { downloadModpack } = require("../../lib/curse/api/download");

const {
  getMinecraftVersions
} = require("../../lib/minecraft/api/download/versions");

registerPrompt("autocomplete", promptAutocomplete);

exports.command = "install";
exports.describe = "interactively install an instance";

exports.handler = command(async () => {
  const { installType, instanceName } = await prompt([
    {
      name: "installType",
      type: "list",
      message: "What kind of server?",
      choices: [
        { name: "Vanilla Minecraft", value: "vanilla" },
        { name: "CurseForge/Twitch Modpack", value: "curse" },
        { name: "Custom Setup", value: "custom" }
      ]
    },
    {
      name: "instanceName",
      type: "text",
      message: "Pick a unique name for the server",
      default: hri.random()
    }
  ]);

  const tmpDir = await installers[installType]({ instanceName });

  const instanceDir = await task(
    async () => installInstanceFromPath(tmpDir.path, instanceName),
    "Creating Bedrock instance...",
    "Bedrock instance created!",
    "Failed to create bedrock instance!"
  );

  const { nextStep } = await prompt([
    {
      name: "nextStep",
      type: "list",
      message: "What now?",
      choices: [
        { name: "Edit the server configuration", value: "config" },
        installType !== "vanilla" && {
          name: "Install some extra mods",
          value: "mods"
        },
        { name: "Start the instance now!", value: "start" },
        { name: "Nothing, I'm done", value: "done" }
      ].filter(identity)
    }
  ]);
  switch (nextStep) {
    case "config":
      throw new Error("Not yet implemented");
    case "mods":
      throw new Error("Not yet implemented");
    case "start":
      return await task(
        async () => startInstance(instanceDir, instanceName),
        "Starting instance...",
        "Instance started!",
        "Instance failed to start"
      );
    case "done":
      return;
  }
});

const installVanilla = async ({ instanceName }) => {
  const { version } = await prompt([
    {
      name: "version",
      type: "autocomplete",
      message: "Which version of Minecraft?",
      source: async (answers, input) => {
        const versions = await getMinecraftVersions();
        const filtered = input
          ? versions.filter(({ id }) => id.startsWith(input))
          : versions.filter(({ type }) => type === "release");
        return filtered.map(({ id }) => ({ name: id, value: id }));
      }
    }
  ]);
  return await task(
    async () => installMinecraft(version, instanceName),
    `Installing Minecraft ${version}`,
    `Installed Minecraft ${version}`,
    `Failed to install Minecraft ${version}`
  );
};

const installCurseForge = async ({ instanceName }) => {
  const memoizedSearch = memoize(searchModpacks);
  const { modpack, file } = await prompt([
    {
      name: "modpack",
      type: "autocomplete",
      message: "Which CurseForge modpack?",
      source: async (answers, input = "") => {
        try {
          const modpacks = input.length > 2 ? await memoizedSearch(input) : [];
          return modpacks.map(pack => ({
            name: highlight(pack.name, input),
            value: pack
          }));
        } catch (e) {
          return [];
        }
      }
    },
    {
      name: "file",
      type: "autocomplete",
      message: "Which version?",
      source: async ({ modpack }, input) => {
        const files = await projectFilesPage(modpack.projectUrl);
        return files
          .filter(({ name }) => !input || name.includes(input))
          .map(file => ({ name: file.name, value: file }));
      }
    }
  ]);

  const [, , projectId, , fileId] = file.downloadUrl.split(/\//g);
  return await task(
    async () => await downloadModpack(projectId, fileId, instanceName),
    `Installing ${modpack.name}...`,
    `Installed ${modpack.name}!`,
    `Failed to install ${modpack.name}`
  );
};

const installCustom = () => {
  throw new Error("Not implemented yet");
};

const installers = {
  vanilla: installVanilla,
  curse: installCurseForge,
  custom: installCustom
};
