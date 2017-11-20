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

const parseDateEl = ({ attributes }) =>
  parseDate(parseInt(attributes['data-epoch'], 10) * 1000)
const parseTextEl = ({ text = '' }) => text.trim()

const modpackDetail = makeScraper({
  name: 'modpackDetail',
  urlFormatter: ({ id }) => makeCurseForgeUrl(`/minecraft/modpacks/${id}`),
  pageModel: {
    rootSelector: '#content',
    fields: [
      {
        id: 'title',
        selector:
          '.project-details .project-header .project-header__details .name',
        format: parseTextEl
      },
      {
        id: 'updatedAt',
        selector:
          '.project-details .project-header .project-header__details .stats--last-updated abbr',
        format: parseDateEl
      },
      {
        id: 'gameVersion',
        selector:
          '.project-details .project-header .project-header__details .stats--game-version',
        format: ({ text = '' }) => text.replace(/^Game Version:\s+/, '')
      },
      {
        id: 'description',
        selector: '.project-details .project__description',
        format: parseTextEl
      },
      {
        id: 'curseProjectID',
        selector: '.project-header .button--twitch',
        format: ({ attributes }) =>
          JSON.parse(attributes['data-action-value']).ProjectID
      }
    ]
  }
})

module.exports = {
  modpackDetail
}
