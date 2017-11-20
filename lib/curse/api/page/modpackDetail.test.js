const { modpackDetail } = require('./modpackDetail')

describe('modpackDetail', () => {
  it('should be a function', () =>
    expect(typeof modpackDetail).toBe('function'))

  describe('Age of Engineering', () => {
    let modpack
    beforeEach(async () => {
      modpack = await modpackDetail({ id: 'age-of-engineering' })
    })
    it('should return the modpack', () => {
      expect(modpack).toMatchObject({
        title: 'Age of Engineering',
        gameVersion: '1.10.2',
        curseProjectID: 263897
      })
    })
  })

  describe('Direwolf20 1.12', () => {
    let modpack
    beforeEach(async () => {
      modpack = await modpackDetail({ id: 'ftb-presents-direwolf20-1-12' })
    })
    it('should return the modpack', () => {
      expect(modpack).toMatchObject({
        title: 'FTB Presents Direwolf20 1.12',
        gameVersion: '1.12.2',
        curseProjectID: 281999
      })
    })
  })
})
