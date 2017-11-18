const chalk = require("chalk");
const config = require("config");
const path = require("path");
const {
  stopInstance,
  disconnectFromDaemon
} = require("../../lib/minecraft/api/instance/process");
const { command } = require("../utils");

exports.command = "stop <name>";
exports.describe = "stop an instance";
exports.builder = yargs =>
  yargs.positional("name", {
    describe: "the name of the instance to stop",
    type: "string"
  });

exports.handler = command(async ({ name }) => {
  await stopInstance(name);
  await disconnectFromDaemon();
});
