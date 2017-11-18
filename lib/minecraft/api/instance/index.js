const path = require("path");
const { copy, mkdirs, remove, readJSON, writeJSON } = require("fs-extra");
const config = require("config");
const { executeJar } = require("../../../utils");
const log = require("../logger")("instance");
const { makeInstancePath } = require("./utils");

const installInstanceFromPath = async (tmpPath, name, keepTempDir = false) => {
  log.info("Installing new instance from tmpPath");
  const instancePath = makeInstancePath(name);

  log.trace("Creating new instance directory at", instancePath);
  await mkdirs(instancePath);

  log.trace("Copying files...");
  await copy(tmpPath, instancePath);

  if (!keepTempDir) {
    log.trace("Removing temporary directory");
    await remove(tmpPath);
  }

  return instancePath;
};

// Used only in vanilla installation process to generate server files initially
const launchMinecraftServer = async (
  jar,
  cwd,
  { maxMemory = "1G", minMemory = maxMemory } = {}
) =>
  await executeJar(jar, [`-Xms${minMemory}`, `-Xmx${maxMemory}`, "nogui"], {
    cwd
  });

module.exports = {
  installInstanceFromPath,
  launchMinecraftServer
};
