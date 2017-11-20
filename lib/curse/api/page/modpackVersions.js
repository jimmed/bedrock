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
const parseNumberEl = ({ rawText = '0' }) =>
  parseInt(rawText.trim().replace(/[^-\d]+/g, ''), 10)
const parseTextEl = ({ text = '' }) => text.trim()

const modpackVersions = makeScraper({
  name: 'modpackVersions',
  urlFormatter: ({ id }) =>
    makeCurseForgeUrl(`/minecraft/modpacks/${id}/files`),
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
        id: 'curseProjectID',
        selector: '.project-header .button--twitch',
        format: ({ attributes }) =>
          JSON.parse(attributes['data-action-value']).ProjectID
      },
      {
        id: 'versions',
        selector:
          '.project-content .listing-body .listing .project-file-list__item',
        multiple: true,
        fields: [
          {
            id: 'name',
            selector: '.project-file__name',
            format: ({ attributes }) => attributes.title.trim()
          },
          {
            id: 'releaseType',
            selector: '.file-phase--release',
            format: ({ attributes }) => attributes.title.trim()
          },
          {
            id: 'fileSize',
            selector: '.project-file__size',
            format: parseTextEl // TODO: Parse filesize as bytes
          },
          {
            id: 'createdAt',
            selector: '.project-file__date-uploaded abbr',
            format: parseDateEl
          },
          {
            id: 'gameVersion',
            selector: '.project-file__game-version .version__label',
            format: parseTextEl
          },
          {
            id: 'downloadCount',
            selector: '.project-file__downloads .file__download',
            format: parseNumberEl
          },
          {
            id: 'curseFileID',
            selector: '.project-file__actions .download-button',
            format: ({ attributes }) =>
              JSON.parse(attributes['data-action-value']).ProjectFileID
          }
        ]
      }
    ]
  }
})

module.exports = {
  modpackVersions
}
