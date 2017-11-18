const config = require("config");
const path = require("path");
const makeInstancePath = path.join.bind(this, config.directory.instances);

module.exports = { makeInstancePath };
