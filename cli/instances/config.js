const config = require("config");
const path = require("path");
const chalk = require("chalk");
const { prompt } = require("inquirer");
const externalEditor = require("external-editor");
const { exists } = require("mz/fs");
const yaml = require("js-yaml");
const { command } = require("../utils");
const {
  readServerProperties,
  updateServerProperties
} = require("../../lib/minecraft/api/config/serverProperties");
const {
  readInstanceConfig
} = require("../../lib/minecraft/api/instance/config");
const {
  describeInstance,
  disconnectFromDaemon
} = require("../../lib/minecraft/api/instance/process");

exports.command = "configure <instance>";
exports.describe = "configure an instance";
exports.builder = {
  instance: {
    type: "string",
    describe: "The name of the instance to configure"
  }
};

exports.handler = command(async ({ instance: name }) => {
  const rootDir = makeInstanceDir(name);
  if (!await exists(rootDir)) {
    console.log(
      chalk.white.bold(`Couldn't find an instance called "${name}"\n`)
    );
    console.log(
      chalk.white.bold("You can list the available instances by running:\n")
    );
    console.log(
      chalk.blue.bold("  $"),
      chalk.white(config.meta.name, "instances\n")
    );
    return;
  }

  await actionLoop(name, rootDir);
});

const actionLoop = async (name, rootDir) => {
  const instanceDir = path.join(rootDir, "instance");
  const configFile = await readInstanceConfig(rootDir);
  const { serverPort = "default", pvp = true } = await readServerProperties(
    instanceDir
  );

  // TODO: Make this more about /what/ you're editing, not the API we're calling
  const { action } = await prompt([
    {
      name: "action",
      type: "list",
      message: "What would you like to do?",
      choices: [
        {
          name: `Change server port (currently: ${serverPort})`,
          value: "changePort"
        },
        {
          name: `${pvp ? "Disable" : "Enable"} PVP`,
          value: "togglePVP"
        },
        { name: "Manually edit server settings", value: "serverProperties" },
        { name: "All done!", value: "done" }
      ]
    }
  ]);

  switch (action) {
    case "changePort":
      await changePort(instanceDir);
      break;
    case "serverProperties":
      await manuallyEditServerProperties(name, instanceDir);
      break;
    case "togglePVP":
      await togglePVP(instanceDir);
      break;
    case "done":
      return;
  }
  await actionLoop(name, rootDir);
};

const makeInstanceDir = name => path.resolve(config.directory.instances, name);

const changePort = async (cwd, currentPort) => {
  const { newPort } = await prompt([
    {
      name: "newPort",
      default: currentPort,
      message: "Enter a new port number:",
      validate: newPort => newPort >= 1 && newPort <= 65535
    }
  ]);
  await updateServerProperties(cwd, ({ serverPort, ...rest }) => ({
    serverPort: newPort,
    ...rest
  }));
};
const togglePVP = async cwd =>
  await updateServerProperties(cwd, ({ pvp = true, ...rest }) => ({
    pvp: !pvp,
    ...rest
  }));

const manuallyEditServerProperties = async (instanceName, cwd) => {
  await updateServerProperties(cwd, async props => {
    const safeProps = Object.entries(props)
      .filter(([, value]) => value !== null && typeof value !== "undefined")
      .reduce((obj, [key, value]) => ((obj[key] = value), obj), {});
    const res = await new Promise((resolve, reject) => {
      externalEditor.editAsync(
        `# This is a YAML version of the Minecraft server.properties file
# Based on the configuration of the ${config.meta.name} instance "${
          instanceName
        }"
# Make your changes below, save this file, and then quit your editor to
# update your server configuration!

${yaml.safeDump(safeProps)}`,
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });
    try {
      return yaml.safeLoad(res);
    } catch (error) {
      console.log("Invalid YAML!", error.stack);
      throw error;
    }
  });
  console.log("Your changes have been saved!");
};
