const HTMLParser = require('fast-html-parser')
const parseDate = require('date-fns/parse')
const { unescape } = require('lodash')
const { fetchHtmlPage } = require('./utils')
const { projectSearchUrl, baseUrl } = require('../url')

const projectSearchPage = async (search, page) => {
  const html = await fetchProjectSearchPage(search, page)
  return parseProjectSearchPage(html)
}

const fetchProjectSearchPage = async (search, page) =>
  (await fetchHtmlPage(projectSearchUrl(search, page))).trim()

const parseProjectSearchPage = pageHtml => {
  const [pageBody] = pageHtml
    .replace(/\r?\n/g, '')
    .match(/<body[^>]*>(.+)<\/body>/)
  const root = HTMLParser.parse(pageBody)
  const pageContent = root.querySelector('#content')

  // check for error message
  const errorPanel = pageContent.querySelector('.alert')

  if (errorPanel) {
    return { resultCount: 0, results: [] }
  }

  // get result count
  const projectsTab = pageContent.querySelector(
    '.tabbed-container .b-tab-item a'
  )
  const rawCount = projectsTab.childNodes[0].rawText.match(/\((\d+)\)/)[1]
  const resultCount = parseInt(rawCount, 10)

  // get results
  const resultsList = pageContent.querySelectorAll('.results')

  const results = resultsList.map(row => {
    const link = row.querySelector('.results-name a')
    const name = unescape(link.rawText.trim()).replace(/&#x(\d+);/g, ([, n]) =>
      String.fromCharCode(parseInt(`0x${n}`))
    )
    const projectUrl = `${baseUrl}${link.attributes.href.split('?')[0]}`
    const description = unescape(
      row.querySelector('.results-summary').rawText.trim()
    )
    const owner = unescape(row.querySelector('.results-owner a').rawText)
    const image = row.querySelector('.results-image img').attributes.src
    const lastUpdated = parseDate(
      parseInt(
        row.querySelector('.results-date abbr').attributes['data-epoch'],
        10
      ) * 1000
    )

    return {
      name,
      projectUrl,
      description,
      owner,
      image,
      lastUpdated
    }
  })

  return { resultCount, results }
}

module.exports = {
  projectSearchPage,
  fetchProjectSearchPage,
  parseProjectSearchPage
}
