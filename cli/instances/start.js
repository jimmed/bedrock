const chalk = require("chalk");
const config = require("config");
const path = require("path");
const {
  startInstance,
  disconnectFromDaemon
} = require("../../lib/minecraft/api/instance/process");
const { command } = require("../utils");

exports.command = "start <name>";
exports.describe = "start an instance";
exports.builder = yargs =>
  yargs.positional("name", {
    describe: "the name of the instance to start",
    type: "string"
  });

exports.handler = command(async ({ name }) => {
  const instanceDir = path.join(config.directory.instances, name);
  const instance = await startInstance(instanceDir);
  console.log(instance);
  await disconnectFromDaemon();
});
