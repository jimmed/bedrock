const { parse: parseUrl, format: formatUrl } = require('url')
const parseDate = require('date-fns/parse')
const { makeScraper } = require('./scraper')

const baseUrl = parseUrl(`https://www.curseforge.com/`)
const makeCurseForgeUrl = (path, query = {}) =>
  formatUrl({
    ...baseUrl,
    pathname: path,
    query
  })

const isServerPackCategory = text => text === 'Includes server downloads'
const parseNumberEl = ({ rawText = '0' }) =>
  parseInt(rawText.trim().replace(/[^-\d]+/g, ''), 10)
const parseDateEl = ({ attributes }) =>
  parseDate(parseInt(attributes['data-epoch'], 10) * 1000)
const parseTextEl = ({ rawText = '' }) => rawText.trim()

const searchModpacks = makeScraper({
  name: 'searchModpacks',
  urlFormatter: ({ query = '' }) =>
    makeCurseForgeUrl(`/minecraft/modpacks/search`, {
      search: query
    }),
  pageModel: {
    rootSelector: '#content .tabbed-container',
    fields: [
      {
        id: 'resultCount',
        selector: '.j-tab-search .b-tab-item',
        format: parseNumberEl
      },
      {
        id: 'pages',
        multiple: true,
        selector: '#tab-modpacks .listing-header .b-pagination-item a',
        format: ({ attributes: { href, rel } }) => ({ href, rel })
      },
      {
        id: 'results',
        multiple: true,
        selector:
          '#tab-modpacks .listing-body .project-list-item .list-item__inner',
        fields: [
          {
            id: 'detailUrl',
            selector: '.list-item__avatar .avatar__container',
            format: ({ attributes }) => attributes.href
          },
          {
            id: 'image',
            selector: '.list-item__avatar img',
            format: ({ attributes }) => attributes.src
          },
          {
            id: 'title',
            selector: '.list-item__title',
            format: parseTextEl
          },
          {
            id: 'downloadCount',
            selector: '.list-item__details .count--download',
            format: parseNumberEl
          },
          {
            id: 'updatedAt',
            selector: '.list-item__details .date--updated abbr',
            format: parseDateEl
          },
          {
            id: 'createdAt',
            selector: '.list-item__details .date--created abbr',
            format: parseDateEl
          },
          {
            id: 'description',
            selector: '.list-item__description p',
            format: ({ attributes }) => attributes.title.trim()
          },
          {
            id: 'categories',
            selector: '.list-item__categories .category__item',
            multiple: true,
            format: ({ attributes }) => attributes.title.trim()
          }
        ],
        format: categories =>
          categories.map(({ categories, ...rest }) => {
            const hasServerPack = !!categories.find(isServerPackCategory)
            return {
              ...rest,
              hasServerPack,
              categories: hasServerPack
                ? categories.filter(text => !isServerPackCategory(text))
                : categories
            }
          })
      }
    ]
  }
})

module.exports = {
  searchModpacks
}
