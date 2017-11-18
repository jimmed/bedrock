const list = require("./list");
const start = require("./start");
const stop = require("./stop");
const restart = require("./restart");
const config = require("./config");
const rcon = require("./rcon");

exports.command = "instances";
exports.describe = "manage instances";
exports.builder = yargs => {
  yargs
    .command(list)
    .command(start)
    .command(stop)
    .command(restart)
    .command(config)
    .command(rcon);
};
