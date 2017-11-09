const fs = require('mz/fs')
const path = require('path')
const fetch = require('make-fetch-happen')
const config = require('config')
const log = require('./logger')('utils')
const { exec } = require('mz/child_process')

const cachedFetch = fetch.defaults({
  cacheManager: config.directory.fetchCache
})

const fetchLogger = log('fetch')
const downloadStreamToFile = async (url, dir, fileName) => {
  fetchLogger.trace(`Downloading ${url} to ${dir}`)
  const download = await cachedFetch(url)
  const fileNameFromUrl = download.url.split(/\//g).slice(-1)[0]
  const filePath = path.join(dir, fileName || fileNameFromUrl)
  const file = fs.createWriteStream(filePath)
  if (!download.ok) {
    fetchLogger.error('While downloading file', url, download)
    throw new Error('HTTP error')
  }
  await new Promise((resolve, reject) => {
    file.on('error', reject)
    file.on('finish', resolve)
    download.body.pipe(file)
  })
  return filePath
}

const executeJar = async (jar, args = [], options = {}) => {
  const command = `java -jar ${jar} ${args.join(' ')}`.trim()
  log.debug('Executing JAR:', command)
  const stdout = await exec(command, options)
  prettyPrintStdout(stdout)
  return stdout
}

const javaLogger = log('java')
const prettyPrintStdout = (lines = [], level = 'trace') =>
  lines
    .map(line => line.split(/\r?\n/g))
    .reduce((flattened, lines) => flattened.concat(lines), [])
    .filter(line => line)
    .forEach(line => javaLogger[level](line))

module.exports = { downloadStreamToFile, cachedFetch, executeJar }
