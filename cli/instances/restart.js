const chalk = require("chalk");
const config = require("config");
const path = require("path");
const {
  restartInstance,
  disconnectFromDaemon
} = require("../../lib/minecraft/api/instance/process");
const { command } = require("../utils");

exports.command = "restart <name>";
exports.describe = "restart an instance";
exports.builder = yargs =>
  yargs.positional("name", {
    describe: "the name of the instance to restart",
    type: "string"
  });

exports.handler = command(async ({ name }) => {
  const instance = await restartInstance(name);
  console.log(instance);
  await disconnectFromDaemon();
});
