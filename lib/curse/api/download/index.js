#!/usr/bin/env node
const config = require("config");
const fetch = require("make-fetch-happen");
const path = require("path");
const fs = require("mz/fs");
const { exec } = require("mz/child_process");
const tmp = require("tmp-promise");
const decompress = require("decompress");
const { copy, mkdirs, remove } = require("fs-extra");
const HttpError = require("http-errors");

const log = require("../logger")("install");
const { modpackDownloadUrl } = require("../url");
const { installForgeServer, downloadForgeServer } = require("./forge");
const {
  installMinecraftInstance,
  generateServerFiles,
  agreeToEula
} = require("../../../minecraft/api/download");
const { downloadStreamToFile, executeJar } = require("../../../utils");
const {
  updateInstanceConfig
} = require("../../../minecraft/api/instance/config");
const { projectFilePage } = require("../page/projectFile");

// TODO: Handle curse server packs
const downloadModpack = async (
  projectId,
  fileId,
  instanceName,
  preferServerPack = false
) => {
  const modpackPage = await projectFilePage(projectId, fileId);
  const serverPack = modpackPage.additionalFiles.find(
    ({ isServerPack }) => isServerPack
  );

  const useServerPack = serverPack && preferServerPack;
  const downloadUrl = useServerPack
    ? serverPack.downloadUrl
    : modpackPage.downloadUrl;

  log.trace(
    "Pre-built server pack",
    serverPack ? "available" : "not available"
  );
  log.trace(useServerPack ? "Using" : "Not using", "server pack");
  log.trace("Download URL selected as", downloadUrl);

  const tmpDir = await tmp.dir();
  log.trace("Created temporary working directory", tmpDir);

  const instanceDir = path.join(tmpDir.path, "instance");
  await mkdirs(instanceDir);
  log.trace("Created instance directory", instanceDir);

  const {
    name,
    version,
    minecraft,
    files,
    overrides
  } = await downloadModpackBundle(
    `${config.url.curse}${downloadUrl}`,
    tmpDir.path
  );

  const serverJar = await installMinecraftInstance(
    minecraft.version,
    instanceDir,
    instanceName
  );

  const [modLoaders] = await Promise.all([
    installModLoaders(minecraft, instanceDir),
    !useServerPack && downloadDependencies(files, instanceDir)
  ]);

  if (!useServerPack && overrides) {
    await installOverrides(path.join(tmpDir.path, overrides), instanceDir);
  }

  await updateInstanceConfig(tmpDir.path, existingConfig => ({
    ...existingConfig,
    type: "CurseForge",
    modpack: {
      projectId,
      fileId,
      name,
      version,
      isServerPack: useServerPack
    }
  }));

  log.info("Installation finished");
  return tmpDir;
};

const downloadModpackBundle = async (url, path, keepBundle = false) => {
  log.info("Downloading modpack", url);
  const modpackBundle = await downloadStreamToFile(url, path);

  log.debug("Download complete, decompressing...", modpackBundle);
  const files = await decompress(modpackBundle, path);

  if (!keepBundle) {
    log.debug("Deleting downloaded bundle...");
    await remove(modpackBundle);
  }

  log.trace("Finding manifest file...");
  const manifestFile = files.find(
    ({ type, path }) => type === "file" && path === "manifest.json"
  );
  if (!manifestFile) {
    throw new Error("Could not find manifest.json in downloaded bundle");
  }

  log.trace("Parsing manifest file...");
  const manifest = JSON.parse(manifestFile.data.toString("utf8"));

  log.info(
    `Downloaded modpack: ${manifest.name} v${manifest.version} for ${
      manifest.minecraft.version
    }`
  );
  log.trace(" - MC version:", manifest.minecraft.version);
  log.trace(" - Modloaders:");
  manifest.minecraft.modLoaders.forEach(({ id, primary }) =>
    log.trace("   -", id, primary ? "(primary)" : "")
  );

  return manifest;
};

const installOverrides = async (overrides, cwd, keepOverrides = false) => {
  if (!overrides) return;
  log.debug("Copying modpack overrides from", overrides);
  await copy(overrides, cwd);
  if (!keepOverrides) await remove(overrides);
};

const modLoaderDownloaders = {
  forge: installForgeServer
};

const installModLoaders = async ({ version, modLoaders = [] }, dir) => {
  return Promise.all(
    modLoaders.map(async ({ id }) => {
      const [type, modloaderVersion] = id.split(/-/g);
      const downloader = modLoaderDownloaders[type];
      if (!downloader) throw new Error(`Unknown modloader: ${id}`);
      const result = await downloader(version, modloaderVersion, dir);
      return result;
    })
  );
};

const downloadDependencies = async (files = [], instanceDir) => {
  log.info("Downloading", files.length, "dependencies");
  const cwd = path.join(instanceDir, "mods");
  await mkdirs(cwd);
  return Promise.all(
    files.map(({ fileID, projectID }) =>
      downloadDependency(projectID, fileID, cwd)
    )
  );
};

const downloadDependency = async (projectID, fileID, cwd) => {
  const projectDetails = await projectFilePage(projectID, fileID);
  console.log(projectDetails);
  try {
    return await downloadStreamToFile(
      modpackDownloadUrl(projectID, fileID),
      cwd
    );
  } catch (error) {
    if (error instanceof HttpError.NotFound) {
      throw new Error(
        `Sadly, one of the required dependencies could not be found on CurseForge.`
      );
    }
    throw error;
  }
};

module.exports = {
  downloadModpack
};

if (!module.parent) {
  const url = process.argv.slice(-2);
  downloadModpack(...url).then(
    result => log.info("DONE!", result),
    error => log.error("FAILED!", error.stack)
  );
}
