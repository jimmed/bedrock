const { parsePage, makeParser } = require('./scraper')

const fixtures = {
  bad: `This is not HTML at all, sorry there my lovelies`,
  basic: `<html><body><h1>Hey</h1><h2>Hi</h2></body></html>`,
  nested: `<body>
    <h1>Results</h1>
    <table>
      <thead><tr><th>ID</th><th>Name</th></thead>
      <tbody>
        <tr><td class="id">1</td><td class="name">Apple</td></tr>
        <tr><td class="id">2</td><td class="name">Orange</td></tr>
        <tr><td class="id">3</td><td class="name">Pear</td></tr>
      </tbody>
    </table>
  </body>`
}

describe('parsePage', () => {
  it('should be a function', () => expect(typeof parsePage).toBe('function'))

  it('should parse basic HTML', () => {
    const result = parsePage('page', fixtures.basic)
    expect(result).toHaveProperty('childNodes')
    expect(result.childNodes[0].tagName).toBe('h1')
    expect(result.childNodes[0].rawText).toBe('Hey')
    expect(result.childNodes[1].tagName).toBe('h2')
    expect(result.childNodes[1].rawText).toBe('Hi')
    expect(typeof result.querySelector).toBe('function')
    expect(typeof result.querySelectorAll).toBe('function')
  })

  it('should throw an error on bad HTML', () => {
    expect(() => parsePage('badPage', fixtures.bad)).toThrow()
  })
})

describe('makeParser', () => {
  it('should be a function', () => expect(typeof makeParser).toBe('function'))

  describe('basic usage', () => {
    let parser
    beforeEach(() => {
      parser = makeParser('basicTest', {
        fields: [
          {
            id: 'title',
            selector: 'h1',
            format: ({ text }) => text
          },
          {
            id: 'subtitle',
            selector: 'h2',
            format: ({ text }) => text
          }
        ]
      })
    })

    it('should create a parser function', () =>
      expect(typeof parser).toBe('function'))

    it('should parse the page when called', () => {
      const result = parser(fixtures.basic)
      expect(result).toEqual({
        title: 'Hey',
        subtitle: 'Hi'
      })
    })
  })

  describe('nested resolvers', () => {
    let parser
    beforeEach(() => {
      parser = makeParser('nestedTest', {
        fields: [
          {
            id: 'title',
            selector: 'h1',
            format: ({ text }) => text
          },
          {
            id: 'asArray',
            selector: 'table tbody tr',
            multiple: true,
            fields: [
              {
                id: 'id',
                selector: '.id',
                format: ({ text }) => text
              },
              {
                id: 'name',
                selector: '.name',
                format: ({ text }) => text
              }
            ]
          },
          {
            id: 'asObject',
            selector: 'table tbody tr',
            multiple: true,
            fields: [
              {
                id: 'id',
                selector: '.id',
                format: ({ text }) => text
              },
              {
                id: 'name',
                selector: '.name',
                format: ({ text }) => text
              }
            ],
            format: results =>
              results.reduce((obj, { id, name }) => ((obj[id] = name), obj), {})
          }
        ]
      })
    })

    it('should create a parser function', () => {
      expect(typeof parser).toBe('function')
    })

    it('should parse the page when called', () => {
      const result = parser(fixtures.nested)
      expect(result).toMatchObject({
        title: 'Results',
        asArray: [
          { id: '1', name: 'Apple' },
          { id: '2', name: 'Orange' },
          { id: '3', name: 'Pear' }
        ],
        asObject: {
          1: 'Apple',
          2: 'Orange',
          3: 'Pear'
        }
      })
    })
  })

  describe('bad usage', () => {
    let parser
    beforeEach(() => {
      parser = makeParser('basicTest', {
        fields: [
          {
            id: 'title',
            selector: '.nonexistant',
            format: ({ text }) => text
          }
        ]
      })
    })

    it('should throw an error when missing an element', () => {
      expect(() => parser(fixtures.basic)).toThrow()
    })
  })
})
