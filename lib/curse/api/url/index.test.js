const api = require('./')

describe('Curse URL API', () => {
  test('exists', () => expect(api).toBeDefined())
  test('has a baseUrl', () => expect(api.baseUrl).toBeDefined())

  describe('makeUrl', () => {
    test('exists', () => expect(api.makeUrl).toBeDefined())

    let testCases = [
      {
        name: 'should return the root URL with no params',
        input: [],
        expected: `${api.baseUrl}`
      },
      {
        name: 'should return a simple path URL',
        input: ['modpacks'],
        expected: `${api.baseUrl}/modpacks`
      },
      {
        name: 'should return a complex search URL',
        input: ['search', { search: 'age of engineering', 'projects-page': 2 }],
        expected: `${api.baseUrl}/search?search=age%20of%20engineering&projects-page=2`
      }
    ]

    testCases.forEach(({ name, input, expected }) => {
      test(name, () => {
        const outcome = api.makeUrl(...input)
        expect(outcome).toEqual(expected)
      })
    })
  })

  describe('projectSearchUrl', () => {
    test('exists', () => expect(api.projectSearchUrl).toBeDefined())

    let testCases = [
      {
        name: 'should return a basic search query URL',
        input: ['age of engineering'],
        expected: `${api.baseUrl}/search?search=age%20of%20engineering`
      },
      {
        name: 'should return a second page of a search query URL',
        input: ['age of engineering', 2],
        expected: `${api.baseUrl}/search?search=age%20of%20engineering&project-page=2`
      }
    ]

    testCases.forEach(({ name, input, expected }) => {
      test(name, () => {
        const outcome = api.projectSearchUrl(...input)
        expect(outcome).toEqual(expected)
      })
    })
  })
})
