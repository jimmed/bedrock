const fs = require("mz/fs");
const path = require("path");
const {
  updateInstanceConfig
} = require("../../../minecraft/api/instance/config");
const { forgeDownloadUrl } = require("../url");
const log = require("../logger")("forge");
const { downloadStreamToFile, executeJar } = require("../../../utils");

const downloadForgeServer = async (version, forgeVersion, instanceDir) => {
  log.debug("Downloading Forge server version", forgeVersion);
  const serverJar = await downloadStreamToFile(
    forgeDownloadUrl(version, forgeVersion),
    instanceDir
  );
  log.trace("Server JAR file at", serverJar);
  return serverJar;
};

const installForgeServer = async (mcVersion, forgeVersion, cwd) => {
  log.info("Downloading forge", forgeVersion);
  const installer = await downloadForgeServer(mcVersion, forgeVersion, cwd);
  log.debug("Installing forge...");
  await executeJar(installer, ["--installServer"], { cwd });
  log.debug("Forge", forgeVersion, "installed");

  await Promise.all([fs.unlink(installer), fs.unlink(`${installer}.log`)]);

  const rootDir = path.resolve(cwd, "..");
  const forgeJar = path.relative(
    rootDir,
    installer.replace(/installer\.jar$/, "universal.jar")
  );
  await updateInstanceConfig(rootDir, existingConfig => ({
    ...existingConfig,
    type: existingConfig.type === "Vanilla" ? "Forge" : existingConfig.type,
    forge: { serverJar: forgeJar, version: forgeVersion }
  }));

  return forgeJar;
};

module.exports = { downloadForgeServer, installForgeServer };
