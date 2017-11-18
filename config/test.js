const defaultConfig = require("./default");
const testConfig = {
  ...defaultConfig,
  directory: Object.entries(defaultConfig.directory).reduce(
    (dirs, [key, path]) => {
      dirs[key] = path.replace(/\.bedrock/g, ".bedrock-test");
      return dirs;
    },
    {}
  )
};
