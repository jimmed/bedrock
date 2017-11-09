const chalk = require('chalk')
const {
  startInstance,
  disconnectFromDaemon
} = require('../../lib/minecraft/api/instance/process')
const { command } = require('../utils')

exports.command = 'start <name>'
exports.describe = 'start an instance'
exports.builder = yargs =>
  yargs.positional('name', {
    describe: 'the name of the instance to start',
    type: 'string'
  })

exports.handler = command(async ({ instanceDir }) => {
  const instance = await startInstance(instanceDir)
  console.log(instance)
  await disconnectFromDaemon()
})
