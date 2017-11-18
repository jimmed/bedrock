const config = require("config");
const path = require("path");
const { readJSON, writeJSON } = require("fs-extra");

const getInstanceConfigPath = cwd => path.join(cwd, "instance.json");

const readInstanceConfig = async cwd =>
  await readJSON(getInstanceConfigPath(cwd));

const writeInstanceConfig = async (cwd, config) =>
  await writeJSON(getInstanceConfigPath(cwd), config);

const createInstanceConfig = async (version, name, serverJar, cwd) => {
  await writeInstanceConfig(cwd, {
    name,
    type: "Vanilla",
    manager: config.meta,
    minecraft: {
      version,
      serverJar: path.relative(cwd, serverJar)
    }
  });
};

const updateInstanceConfig = async (cwd, update = x => x) => {
  const oldConfig = await readInstanceConfig(cwd);
  const newConfig = update(oldConfig);
  return await writeInstanceConfig(cwd, newConfig);
};

module.exports = {
  getInstanceConfigPath,
  readInstanceConfig,
  writeInstanceConfig,
  createInstanceConfig,
  updateInstanceConfig
};
