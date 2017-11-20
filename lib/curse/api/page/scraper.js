const HTMLParser = require('fast-html-parser')
const { fetchHtmlPage } = require('./utils')

// TODO: Improve error handling on page models
const makeScraper = ({ name, urlFormatter, pageModel }) => {
  const fetchPage = makeFetcher(name, urlFormatter)
  const parsePage = makeParser(name, pageModel)
  return async params => {
    const pageHtml = await fetchPage(params)
    return parsePage(pageHtml, params)
  }
}

const formatUrl = ({ name, urlFormatter, params }) => {
  try {
    return urlFormatter(params)
  } catch (sourceError) {
    throw new ScraperUrlFormattingError({ name, params, sourceError })
  }
}

const fetchPage = async ({ url, name, params }) => {
  try {
    return await fetchHtmlPage(url)
  } catch (sourceError) {
    throw new ScraperFetchingError({ url, name, params, sourceError })
  }
}

const parsePage = (name, pageHtml, params) => {
  try {
    const [, pageBody] = pageHtml
      .replace(/\r?\n/g, '')
      .match(/<body[^>]*>(.+)<\/body>/)
    return HTMLParser.parse(pageBody)
  } catch (sourceError) {
    throw new ScraperParsingError({ name, html: pageHtml, sourceError })
  }
}

const makeFetcher = (name, urlFormatter) => async params => {
  const url = formatUrl({ name, urlFormatter, params })
  return await fetchPage({ url, name, params })
}

const makeParser = (name, pageModel) => {
  const makePageModelInstance = makePageModelInstanceFactory(name, pageModel)
  return (pageHtml, params) => {
    const pageBody = parsePage(name, pageHtml, params)
    return makePageModelInstance(pageBody)
  }
}

const makePageModelInstanceFactory = (
  name,
  { rootSelector, fields = [] }
) => body => {
  const pageRoot = rootSelector ? body.querySelector(rootSelector) : body
  if (!pageRoot) {
    throw new ScraperMissingElementError({ name, selector: rootSelector })
  }
  return fields.reduce(
    (model, { id, multiple = false, selector, format, fields }) => {
      const el = selector
        ? pageRoot[multiple ? 'querySelectorAll' : 'querySelector'](selector)
        : pageRoot
      if (!multiple && !el) {
        throw new ScraperMissingElementError({
          name: `${name}.${id}`,
          selector,
          html: body
        })
      }

      let data = el

      if (fields) {
        const childPageModelInstanceFactory = makePageModelInstanceFactory(
          `${name}.${id}`,
          { fields }
        )
        data = multiple
          ? el.map(childPageModelInstanceFactory)
          : childPageModelInstanceFactory(el)
      }

      model[id] = format
        ? multiple && !fields ? data.map(format) : format(data)
        : data

      return model
    },
    {}
  )
}

class ScraperError extends Error {
  constructor({ name = 'UnknownScraper', sourceError }) {
    super(`An error occurred in the "${name}" scraper`)
    this.scraperName = name
    this.sourceError = sourceError
    if (sourceError instanceof Error) {
      this.stack = `${sourceError.stack}\n\n${this.stack}`
    }
  }
}

class ScraperUrlFormattingError extends ScraperError {
  constructor({ params, ...rest }) {
    super(rest)
    this.message += `, while formatting the URL for params: ${json(params)}`
    this.params = {}
  }
}

class ScraperFetchingError extends ScraperError {
  constructor({ url, params, ...rest }) {
    super(rest)
    this.message += `, while fetching the page content for the URL:\n\n> ${url}\n`
    this.url = url
    this.params = params
  }
}

class ScraperParsingError extends ScraperError {
  constructor({ html, ...rest }) {
    super(rest)
    this.message += `, while parsing the HTML of the page`
    this.html = html
  }
}

class ScraperMissingElementError extends ScraperError {
  constructor({ name, selector, ...rest }) {
    super(rest)
    this.scraperName = name
    this.selector = selector
    this.message = `The "${name}" scraper could not find an element matching selector "${selector}"`
  }
}

const json = val => JSON.stringify(val)

module.exports = {
  makeScraper,
  makeFetcher,
  makeParser,
  makePageModelInstanceFactory,
  ScraperError,
  parsePage
}
