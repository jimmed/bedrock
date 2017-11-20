const { modpackVersions } = require('./modpackVersions')

describe('modpackVersions', () => {
  it('should be a function', () =>
    expect(typeof modpackVersions).toBe('function'))

  describe('Age of Engineering', () => {
    let modpack
    beforeEach(async () => {
      modpack = await modpackVersions({ id: 'age-of-engineering' })
    })
    it('should return the modpack', () => {
      expect(modpack).toMatchObject({
        title: 'Age of Engineering',
        curseProjectID: 263897
      })
      modpack.versions.forEach(version => {
        expect(version).toHaveProperty('name')
        expect(version).toHaveProperty('curseFileID')
      })
    })
  })
})
