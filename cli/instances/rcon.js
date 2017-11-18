const chalk = require("chalk");
const config = require("config");
const path = require("path");
const { prompt } = require("inquirer");
const Rcon = require("modern-rcon");
const keypress = require("keypress");
const {
  describeInstance,
  restartInstance,
  disconnectFromDaemon
} = require("../../lib/minecraft/api/instance/process");
const {
  readServerProperties,
  updateServerProperties
} = require("../../lib/minecraft/api/config/serverProperties");
const { command } = require("../utils");

exports.command = "rcon <name>";
exports.describe = "connect to an instance via rcon";
exports.builder = yargs =>
  yargs.positional("name", {
    describe: "the name of the instance to connect to",
    type: "string"
  });

exports.handler = command(async ({ name }) => {
  const [instance] = await describeInstance(name);
  await disconnectFromDaemon();
  if (!instance) {
    console.log("Instance is not running!");
    return;
  }

  const { cwd } = instance.pm2_env;

  const server = await readServerProperties(cwd);
  const {
    forceRcon,
    forceRconPassword,
    forceRconPort,
    allowRestart
  } = await prompt([
    {
      name: "forceRcon",
      type: "confirm",
      default: false,
      message: "RCON is not enabled on this instance. Enable it now?",
      when: () => !server.enableRcon
    },
    {
      name: "forceRconPassword",
      type: "confirm",
      default: false,
      message: "There is no RCON password set on this instance. Set one now?",
      when: () => !server.rconPassword
    },
    {
      name: "forceRconPort",
      type: "confirm",
      default: false,
      message: "The RCON port is not set on this instance. Set one now?",
      when: () => !server.rconPort
    },
    {
      name: "allowRestart",
      type: "confirm",
      default: false,
      message:
        "We'll need to restart the server to make these changes, is that OK?",
      when: ({ forceRcon, forceRconPassword, forceRconPort }) =>
        forceRcon || forceRconPassword | forceRconPort
    }
  ]);

  if ((forceRcon || forceRconPassword || forceRconPort) && !allowRestart) {
    console.log(
      "A restart is required to make any changes to the server settings. No changes have been made."
    );
    return;
  }
  if (!server.enableRcon && !forceRcon) {
    console.log("RCON must be enabled on this instance");
    return;
  }
  if (forceRcon) {
    await updateServerProperties(cwd, props => ({
      ...props,
      enableRcon: true
    }));
  }

  if (!server.rconPassword && !forceRconPassword) {
    console.log("An RCON password is required on this instance");
    return;
  }

  if (forceRconPassword) {
    // TODO: Real password strength + randomisation
    await updateServerProperties(cwd, props => ({
      ...props,
      rconPassword: "testPassword"
    }));
  }
  if (!server.rconPort && !forceRconPort) {
    console.log("An RCON port is required on this instance");
    return;
  }
  if (forceRconPort) {
    await updateServerProperties(cwd, props => ({
      ...props,
      rconPort: (server.serverPort || 25535) + 1
    }));
  }
  if (allowRestart) {
    await restartInstance(name);
    console.log("Server restarted with updated configuration!");
  }

  await rconSession(name);
});

// TODO: Move into own module
// TODO: Detect rcon newline bug and install mod fix
const rconSession = async name => {
  const [instance] = await describeInstance(name);
  await disconnectFromDaemon();
  if (!instance) {
    console.log("Instance is not running!");
    return;
  }

  const { cwd } = instance.pm2_env;

  const server = await readServerProperties(cwd);
  console.log(server);

  const rcon = new Rcon(
    "localhost",
    server.rconPort,
    server.rconPassword,
    30000
  );
  console.log(rcon);
  await rcon.connect();

  keypress(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  let buffer = "";

  await new Promise(resolve => {
    process.stdin.on("keypress", async (chunk, key) => {
      if (key && key.ctrl && (key.name == "c" || key.name == "d")) {
        await rcon.disconnect();
        resolve();
      }
      process.stdout.write(chunk);
      if (key && (key.name == "enter" || key.name == "return")) {
        console.log(await rcon.send(buffer));
        buffer = "";
        process.stdout.write("\n");
      } else if (key && key.name == "backspace") {
        buffer = buffer.slice(0, -1);
        process.stdout.write("\033[K"); // Clear to end of line
      } else {
        buffer += chunk;
      }
    });
  });
};
