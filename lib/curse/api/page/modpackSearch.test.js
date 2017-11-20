const { searchModpacks } = require('./modpackSearch')

describe('searchModpacks', () => {
  it('should be a function', () =>
    expect(typeof searchModpacks).toBe('function'))

  describe('Specific search', () => {
    let result
    beforeEach(async () => {
      result = await searchModpacks({ query: 'age of engineering' })
    })
    it('should return one result', () => {
      expect(result).toMatchObject({
        resultCount: 1,
        pages: []
      })
      expect(result.results.length).toBe(1)
      const [modpack] = result.results
      expect(modpack).toMatchObject({
        title: 'Age of Engineering',
        categories: ['Tech', 'Hardcore', 'Multiplayer', 'Extra Large']
      })
      expect(modpack.downloadCount).toBeGreaterThan(293038) // at time of writing
      expect(modpack.createdAt).toEqual(new Date('2017-03-28T14:19:37Z'))
      expect(+modpack.updatedAt).toBeGreaterThan(+new Date('2017-09-18'))
      expect(modpack.detailUrl).toEqual(
        '/minecraft/modpacks/age-of-engineering'
      )
    })
  })

  describe('Loose search', () => {
    let result
    beforeEach(async () => {
      result = await searchModpacks({ query: 'age' })
    })
    it('should return many result', () => {
      expect(result).toMatchObject({
        resultCount: 50,
        pages: [{ rel: 'next' }]
      })
      expect(result.results.length).toBe(20)
      expect(
        result.results.some(({ hasServerPack }) => hasServerPack)
      ).toBeTruthy()
    })
  })
})
