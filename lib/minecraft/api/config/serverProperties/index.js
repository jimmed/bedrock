const fs = require('mz/fs')
const path = require('path')
const { camelCase, kebabCase, invert } = require('lodash')
const {
  difficultyLevels,
  gameModes,
  levelTypes,
  biomes
} = require('../../constants')

const getServerPropertiesPath = cwd => path.join(cwd, 'server.properties')

const keyOverrides = {
  gamemode: 'gameMode',
  'white-list': 'whitelist',
  'resource-pack-sha1': 'resourcePackSha1'
}
const keyOverridesInverted = invert(keyOverrides)

const propParsers = {
  difficulty: value => difficultyLevels[value],
  gameMode: value => gameModes[value],
  levelType: value => levelTypes.find(type => type.toUpperCase() === value)
}

const propFormatters = {}

const parseProp = value => {
  switch (value.toLowerCase()) {
    case 'true':
      return true
    case 'false':
      return false
  }
  if (parseInt(value, 10).toString() === value) {
    return parseInt(value, 10)
  }
  if (value === '') return null
  return value
}

const formatProp = value => (value === null ? '' : value)

const parseServerProperties = (file, { generatorSettings = false } = {}) => {
  const properties = file
    .toString('utf8')
    .split(/\r?\n/g)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split(/=/))
    .reduce((props, [key, value]) => {
      const ccKey = keyOverrides[key] || camelCase(key)
      const parser = propParsers[ccKey] || parseProp
      props[ccKey] = parser(value)
      return props
    }, {})

  if (generatorSettings) {
    return {
      ...properties,
      generatorSettings: parseGeneratorSettings(properties)
    }
  }

  return properties
}

const parseGeneratorSettings = ({ generatorSettings, worldType }) => {
  switch (worldType) {
    case 'DEFAULT':
    case 'LARGEBIOMES':
    case 'AMPLIFIED':
      return null
    case 'FLAT':
      return parseFlatGeneratorSettings(generatorSettings)
    case 'CUSTOMIZED':
      return JSON.parse(generatorSettings)
  }
  throw new Error(`Unsupported world generation type "${worldType}"`)
}
const parseFlatGeneratorSettings = generatorSettings => {
  const [
    version,
    layers,
    biomeID,
    structures,
    ...rest
  ] = generatorSettings.split(';')
  if (version !== '3') {
    throw new Error('Only version 3 is supported')
  }
  return {
    type: 'Flat',
    version: parseInt(version, 10),
    layers: parseWorldLayers(layers),
    biome: biomes[biomeID] || parseInt(biomeID, 10),
    structures: parseStructures(structures)
  }
}

const parseWorldLayers = code =>
  code
    .split(',')
    .map(layer => layer.split('*').reverse())
    .map(([block, count = 1]) => ({ block, count: parseInt(count, 10) }))

const parseStructures = value => {
  if (!value) return null
  return value.split(',').map(rawStructure => {
    const result = rawStructure.match(/([^\(]+)(?:\(([^\)]+)\))?/)
    const [, type, params = ''] = result
    if (!params) return { type }
    return {
      type,
      params: params
        .split(/\s+/g)
        .filter(line => line)
        .map(rawParam => rawParam.split('='))
        .reduce((params, [key, value]) => {
          params[key] =
            value.indexOf('.') > -1 ? parseFloat(value) : parseInt(value, 10)
          return params
        }, {})
    }
  })
}

const formatServerProperties = props =>
  Object.entries(props)
    .map(([key, value]) => {
      const kcKey = keyOverridesInverted[key] || kebabCase(key)
      const formatter = propFormatters[key] || formatProp
      return `${kcKey}=${formatter(value)}`
    })
    .join('\n') + '\n'

const readServerProperties = async cwd =>
  parseServerProperties(await fs.readFile(getServerPropertiesPath(cwd)))

const writeServerProperties = async (cwd, content) =>
  await fs.writeFile(getServerPropertiesPath(cwd), content, 'utf8')

const updateServerProperties = async (cwd, update = x => x) =>
  await writeServerProperties(cwd, update(await readServerProperties(cwd)))

module.exports = {
  getServerPropertiesPath,
  parseServerProperties,
  parseGeneratorSettings,
  formatServerProperties,
  readServerProperties,
  writeServerProperties,
  updateServerProperties,
  parseProp,
  propParsers
}
