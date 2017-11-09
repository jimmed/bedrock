const os = require('os')
const path = require('path')
const app = require('../package.json')

const homeRelative = path.join.bind(path, os.homedir())
const appRoot = homeRelative(`.${app.name}`)
const rootRelative = path.join.bind(path, appRoot)

module.exports = {
  meta: {
    name: app.name,
    version: app.version
  },
  directory: {
    root: appRoot,
    fetchCache: rootRelative('cache'),
    instances: rootRelative('instances')
  },
  url: {
    minecraftVersions:
      'https://launchermeta.mojang.com/mc/game/version_manifest.json',
    minecraftServer: 'https://s3.amazonaws.com/Minecraft.Download/versions',
    curse: 'https://minecraft.curseforge.com',
    forge: 'http://files.minecraftforge.net/maven/net/minecraftforge/forge'
  },
  log: { '*': 'warn' },
  pm2: {
    prefix: app.name
  },
  jvm: {
    path: 'java'
  }
}
