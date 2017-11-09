const {
  getServerPropertiesPath,
  parseServerProperties,
  formatServerProperties,
  parseGeneratorSettings,
  readServerProperties,
  writeServerProperties,
  updateServerProperties
} = require('./')
const path = require('path')
const fs = require('fs-extra')
const { biomes } = require('../../constants')

describe('server properties api', () => {
  describe('getServerPropertiesPath', () => {
    it('should return a valid server.properties path', () =>
      expect(getServerPropertiesPath('/path/to/dir')).toBe(
        '/path/to/dir/server.properties'
      ))
  })

  const propsPath = getServerPropertiesPath(path.join(__dirname, 'fixtures'))

  let serverPropsJson, serverPropsFile
  beforeEach(async () => {
    serverPropsFile = await fs.readFile(propsPath, 'utf8')
    serverPropsJson = JSON.parse(await fs.readFile(`${propsPath}.json`))
  })
  afterEach(() => (serverPropsJson = serverPropsFile = null))

  describe('parseServerProperties', () => {
    it('should return something', () => {
      const props = parseServerProperties(serverPropsFile)
      expect(parseServerProperties(serverPropsFile)).toEqual(serverPropsJson)
    })
  })

  describe('formatServerProperties', () => {
    it('should return something valid', () => {
      const output = formatServerProperties(serverPropsJson).split(/\r?\n/g)
      const expected = serverPropsFile.split(/\r?\n/g).slice(2)
      output.every(line => expect(expected).toContain(line))
      expected.every(line => expect(output).toContain(line))
    })
  })

  describe('parseGeneratorSettings', () => {
    describe('with a FLAT preset', () => {
      const presets = {
        '3;minecraft:bedrock,2*minecraft:dirt,minecraft:grass;1;village': {
          layers: [
            { block: 'minecraft:bedrock', count: 1 },
            { block: 'minecraft:dirt', count: 2 },
            { block: 'minecraft:grass', count: 1 }
          ],
          structures: [{ type: 'village' }]
        },
        '3;minecraft:bedrock,3*minecraft:stone,52*minecraft:sandstone;2;': {
          layers: [
            { block: 'minecraft:bedrock', count: 1 },
            { block: 'minecraft:stone', count: 3 },
            { block: 'minecraft:sandstone', count: 52 }
          ],
          structures: null
        },
        '3;minecraft:mossy_cobblestone,250*minecraft:air,minecraft:obsidian,minecraft:snow_layer;3;stronghold(distance=10.2 count=7),village(size=0 distance=9),decoration,dungeon,mineshaft': {
          layers: [
            { block: 'minecraft:mossy_cobblestone', count: 1 },
            { block: 'minecraft:air', count: 250 },
            { block: 'minecraft:obsidian', count: 1 },
            { block: 'minecraft:snow_layer', count: 1 }
          ],
          structures: [
            { type: 'stronghold', params: { count: 7, distance: 10.2 } },
            { type: 'village', params: { size: 0, distance: 9 } },
            { type: 'decoration' },
            { type: 'dungeon' },
            { type: 'mineshaft' }
          ]
        }
      }
      Object.entries(presets).forEach(([preset, expected], index) => {
        describe(preset, () => {
          let outcome
          beforeEach(() => {
            outcome = parseGeneratorSettings({
              worldType: 'FLAT',
              generatorSettings: preset
            })
          })
          afterEach(() => (outcome = null))
          if (expected.layers) {
            it('should parse the layers correctly', () => {
              expect(outcome.layers).toEqual(expected.layers)
            })
          }
          if (expected.structures) {
            it('should parse the structure generation correctly', () => {
              expect(outcome.structures).toEqual(expected.structures)
            })
          }
        })
      })
    })
    describe('with a CUSTOMIZED preset', () => {
      it('should parse the world generator settings', () => {
        const outcome = parseGeneratorSettings({
          worldType: 'CUSTOMIZED',
          generatorSettings:
            '{"coordinateScale":684.412,"heightScale":684.412,"lowerLimitScale":512.0,"upperLimitScale":512.0,"depthNoiseScaleX":200.0,"depthNoiseScaleZ":200.0,"depthNoiseScaleExponent":0.5,"mainNoiseScaleX":80.0,"mainNoiseScaleY":160.0,"mainNoiseScaleZ":80.0,"baseSize":8.5,"stretchY":12.0,"biomeDepthWeight":2.0,"biomeDepthOffset":1.0,"biomeScaleWeight":4.0,"biomeScaleOffset":1.0,"seaLevel":63,"useCaves":true,"useDungeons":true,"dungeonChance":8,"useStrongholds":true,"useVillages":true,"useMineShafts":true,"useTemples":true,"useRavines":true,"useWaterLakes":true,"waterLakeChance":4,"useLavaLakes":true,"lavaLakeChance":80,"useLavaOceans":false,"fixedBiome":-1,"biomeSize":4,"riverSize":4,"dirtSize":33,"dirtCount":10,"dirtMinHeight":0,"dirtMaxHeight":256,"gravelSize":33,"gravelCount":8,"gravelMinHeight":0,"gravelMaxHeight":256,"graniteSize":33,"graniteCount":10,"graniteMinHeight":0,"graniteMaxHeight":80,"dioriteSize":33,"dioriteCount":10,"dioriteMinHeight":0,"dioriteMaxHeight":80,"andesiteSize":33,"andesiteCount":10,"andesiteMinHeight":0,"andesiteMaxHeight":80,"coalSize":17,"coalCount":20,"coalMinHeight":0,"coalMaxHeight":128,"ironSize":9,"ironCount":20,"ironMinHeight":0,"ironMaxHeight":64,"goldSize":9,"goldCount":2,"goldMinHeight":0,"goldMaxHeight":32,"redstoneSize":8,"redstoneCount":8,"redstoneMinHeight":0,"redstoneMaxHeight":16,"diamondSize":8,"diamondCount":1,"diamondMinHeight":0,"diamondMaxHeight":16,"lapisSize":7,"lapisCount":1,"lapisCenterHeight":16,"lapisSpread":16}'
        })
        expect(outcome).toHaveProperty('coordinateScale', 684.412)
      })
    })
  })
})
