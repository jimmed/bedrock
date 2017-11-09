const HTMLParser = require('fast-html-parser')
const parseDate = require('date-fns/parse')
const { unescape } = require('lodash')
const { fetchHtmlPage } = require('./utils')

const projectFilesPage = async projectUrl => {
  const html = await fetchProjectFilesPage(projectUrl)
  return parseProjectFilesPage(html)
}

const fetchProjectFilesPage = async projectUrl => {
  const url = `${projectUrl}/files`
  return (await fetchHtmlPage(`${projectUrl}/files`)).trim()
}

const parseProjectFilesPage = pageHtml => {
  const [pageBody] = pageHtml
    .replace(/\r?\n/g, '')
    .match(/<body[^>]*>(.+)<\/body>/)
  const root = HTMLParser.parse(pageBody)
  const pageContent = root.querySelector('#content')
  const rows = pageContent.querySelectorAll(
    '.project-file-listing .project-file-list-item'
  )
  const listings = rows.map(row => {
    const nameLink = row.querySelector('.twitch-link')
    const name = unescape(nameLink.rawText)
    const downloadUrl = nameLink.attributes.href
    const releaseType = row.querySelector('.release-phase').attributes.title
    const fileSize = Math.floor(
      parseFloat(
        row
          .querySelector('.project-file-size')
          .rawText.trim()
          .split(/\s+/)[0],
        10
      ) *
        1024 *
        1024
    )
    const uploadedAt = parseDate(
      row.querySelector('.standard-date').attributes['data-epoch'] * 1000
    )
    const gameVersion = row.querySelector('.version-label').rawText.trim()
    const downloadCount = parseInt(
      row
        .querySelector('.project-file-downloads')
        .rawText.trim()
        .replace(/[^\d]+/g, ''),
      10
    )

    return {
      name,
      downloadUrl,
      releaseType,
      fileSize,
      uploadedAt,
      gameVersion,
      downloadCount
    }
  })
  return listings
}

module.exports = {
  fetchProjectFilesPage,
  parseProjectFilesPage,
  projectFilesPage
}
