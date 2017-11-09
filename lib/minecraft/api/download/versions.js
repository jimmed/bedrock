const fetch = require('make-fetch-happen')
const { memoize } = require('lodash')
const config = require('config')

const getMinecraftVersions = memoize(async () => {
  const res = await fetch(config.url.minecraftVersions)
  if (!res.ok) {
    throw new Error('Error getting Minecraft versions')
  }
  const { versions } = await res.json()
  return versions
})

module.exports = { getMinecraftVersions }
