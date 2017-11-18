const config = require("config");

const minecraftServerDownloadUrl = version =>
  `${config.url.minecraftServer}/${version}/minecraft_server.${version}.jar`;

module.exports = { minecraftServerDownloadUrl };
