const config = require("config");
const driftwood = require("driftwood");

driftwood.enable(config.log);

module.exports = driftwood("bedrock");
