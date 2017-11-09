const config = require('config')
const chalk = require('chalk')
const Table = require('cli-table')
const { command } = require('../utils')
const {
  listInstances,
  disconnectFromDaemon
} = require('../../lib/minecraft/api/instance/process')

exports.command = 'list'
exports.aliases = ['$0']
exports.describe = 'list of available instances'

exports.handler = command(async argv => {
  const instances = await listInstances()
  if (!instances.length) {
    console.log(chalk.white.bold('No instances installed!\n'))
    console.log(
      chalk.white.bold(
        'Get an instance up and running using the following command:\n'
      )
    )
    console.log(
      chalk.blue.bold('  $'),
      chalk.white(config.meta.name, 'install\n')
    )
  } else {
    const table = new Table({
      head: ['Name', 'Type', 'Version', 'Status']
    })
    table.push(
      ...instances.map(({ name, pm2_env: { status }, config }) => [
        name,
        config.type,
        makeVersionString(config),
        status
      ])
    )
    console.log(table.toString())
  }

  await disconnectFromDaemon()
})

const makeVersionString = ({ type, forge, minecraft, modpack }) => {
  switch (type) {
    case 'Vanilla':
      return `${minecraft.version}`
    case 'Forge':
      return `${minecraft.version} (Forge ${forge.version})`
    case 'CurseForge':
      return `${modpack.name} (${modpack.version})`
    default:
      return '-'
  }
}
