const fetch = require('node-fetch')

const fetchHtmlPage = async url => {
  const result = await fetch(url)
  if (!result.ok) {
    throw new Error(`HTTP Error ${result.status}`)
  }
  return await result.text()
}

module.exports = { fetchHtmlPage }
