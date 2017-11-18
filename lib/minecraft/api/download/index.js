const fs = require("mz/fs");
const { readJSON, writeJSON, mkdirs } = require("fs-extra");
const path = require("path");
const config = require("config");
const tmp = require("tmp-promise");
const { minecraftServerDownloadUrl } = require("../url");
const { launchMinecraftServer } = require("../instance");
const { createInstanceConfig } = require("../instance/config");
const { downloadStreamToFile, executeJar } = require("../../../utils");

const log = require("../logger")("install");

const downloadMinecraftServer = async (version, instanceDir) =>
  await downloadStreamToFile(minecraftServerDownloadUrl(version), instanceDir);

const installMinecraft = async (version, name) => {
  const tmpDir = await tmp.dir();
  const cwd = path.join(tmpDir.path, "instance");
  await mkdirs(cwd);
  await installMinecraftInstance(version, cwd, name);
  return tmpDir;
};

const installMinecraftInstance = async (version, cwd, name) => {
  await mkdirs(cwd);
  log.info("Installing Minecraft", version);
  const serverJar = await downloadMinecraftServer(version, cwd);
  await generateServerFiles(serverJar, cwd);
  await agreeToEula(cwd);
  await createInstanceConfig(version, name, serverJar, path.resolve(cwd, ".."));
  return serverJar;
};

const generateServerFiles = async (serverJar, cwd) => {
  log.debug("Booting server for first run...");
  await launchMinecraftServer(serverJar, cwd);
};

const agreeToEula = async cwd => {
  log.debug("Agreeing to EULA...");
  const eulaPath = path.join(cwd, "eula.txt");
  const currentEula = await fs.readFile(eulaPath, "utf8");
  const updatedEula = currentEula.replace("=false", "=true");
  await fs.writeFile(eulaPath, updatedEula, "utf8");
};

module.exports = {
  downloadMinecraftServer,
  installMinecraft,
  installMinecraftInstance,
  generateServerFiles,
  agreeToEula
};
