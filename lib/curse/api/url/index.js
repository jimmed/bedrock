const url = require('url')
const config = require('config')

const baseUrl = config.url.curse
const baseUrlProps = url.parse(baseUrl)

const makeUrl = (pathname, query = {}) =>
  url.format({ ...baseUrlProps, pathname, query })

const projectSearchUrl = (search = '', page = 1) =>
  makeUrl('search', { search, ...(page > 1 ? { 'project-page': page } : {}) })

const modpackDownloadUrl = (projectId, fileId) =>
  makeUrl(`projects/${projectId}/files/${fileId}/download`)

const forgeDownloadUrl = (minecraft, forge) =>
  `${config.url
    .forge}/${minecraft}-${forge}/forge-${minecraft}-${forge}-installer.jar`

module.exports = {
  baseUrl,
  makeUrl,
  projectSearchUrl,
  modpackDownloadUrl,
  forgeDownloadUrl
}
