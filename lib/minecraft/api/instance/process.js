const config = require('config')
const util = require('util')
const path = require('path')
const pm2 = require('pm2')
const { mkdirs } = require('fs-extra')
const { readInstanceConfig } = require('./config')
const log = require('../logger')('instance')
const { makeInstancePath } = require('./utils')

const makeProcessName = name => `${config.pm2.prefix}-${name}`

const promisifyPm2Method = method => util.promisify(pm2[method].bind(pm2))
const startDaemon = promisifyPm2Method('connect')
const killDaemon = promisifyPm2Method('killDaemon')
const disconnectFromDaemon = promisifyPm2Method('disconnect')

const pm2StartInstance = promisifyPm2Method('start')
const pm2StopInstance = promisifyPm2Method('stop')
const pm2DeleteInstance = promisifyPm2Method('delete')
const pm2RestartInstance = promisifyPm2Method('gracefulReload')

const pm2ListInstances = promisifyPm2Method('list')
const pm2DescribeInstance = promisifyPm2Method('describe')

const startInstance = async instanceDir => {
  log.trace('Connecting to PM2 daemon...')
  await startDaemon()
  log.trace('Starting instance from dir', instanceDir)
  const instanceConfig = await readInstanceConfig(instanceDir)
  log.trace('Instance config', instanceConfig)
  const { name, minMemory = '256M', maxMemory = '1G' } =
    instanceConfig.options || {}
  const jar = getServerJar(instanceConfig)
  const logDir = path.join(instanceDir, 'logs')
  await mkdirs(logDir)
  const pm2Config = {
    name: makeProcessName(instanceConfig.name),
    interpreter: 'none',
    script: config.jvm.path,
    args: [
      `-Xms${minMemory}`,
      `-Xmx${maxMemory}`,
      '-jar',
      path.resolve(instanceDir, jar),
      'nogui'
    ],
    cwd: path.join(instanceDir, 'instance'),
    output: path.join(logDir, 'instance-out.log'),
    error: path.join(logDir, 'instance-error.err'),
    pid: path.join(instanceDir, '.pid'),
    minUptime: 30000,
    maxRestarts: 5,
    killTimeout: 30000
  }
  log.info('Starting instance', name)
  log.trace('PM2 config', pm2Config)
  const serverProcess = await pm2StartInstance(pm2Config)
  log.info('Instance started!')
  log.trace('Server process', serverProcess)
  return serverProcess
}

const getServerJar = ({ type, minecraft, forge }) => {
  if (type === 'Forge' || type === 'CurseForge') {
    return forge.serverJar
  }
  return minecraft.serverJar
}

const stopInstance = async name => {
  await startDaemon()
  log.info('Stopping instance', name)
  await pm2StopInstance(makeProcessName(name))
  log.info('Stopped instance', name)
}

const deleteInstance = async name => {
  await startDaemon()
  log.info('Deleting instance', name)
  await pm2DeleteInstance(makeProcessName(name))
  log.info('Instance deleted', name)
}

const restartInstance = async name => {
  await startDaemon()
  log.info('Restarting instance', name)
  const serverProcess = await pm2RestartInstance(makeProcessName(name))
  log.info('Server restarted!', name)
  log.trace('Server process', serverProcess)
  return serverProcess
}

const describeInstance = async name => {
  await startDaemon()
  log.trace('Looking up instance', name)
  const serverProcess = await pm2DescribeInstance(makeProcessName(name))
  const cwd = log.trace('Server process', serverProcess)
  return serverProcess
}

const listInstances = async () => {
  await startDaemon()
  log.trace('Looking up instances')
  const serverProcesses = await pm2ListInstances()
  log.trace('Server processes', serverProcesses)
  return await Promise.all(
    serverProcesses
      .filter(({ name = '' }) => name.startsWith('bedrock-'))
      .map(({ name, ...rest }) => ({
        ...rest,
        name: name.replace(/^bedrock-/, '')
      }))
      .map(async instance => {
        const cwd = makeInstancePath(instance.name)
        const serverConfig = await readInstanceConfig(cwd)
        return { ...instance, config: serverConfig }
      })
  )
}

module.exports = {
  startDaemon,
  killDaemon,
  disconnectFromDaemon,
  startInstance,
  stopInstance,
  restartInstance,
  describeInstance,
  listInstances,
  deleteInstance
}
