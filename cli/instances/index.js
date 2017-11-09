const list = require('./list')
const start = require('./start')
const stop = require('./stop')
const restart = require('./restart')

exports.command = 'instances'
exports.describe = 'manage instances'
exports.builder = yargs => {
  yargs
    .command(list)
    .command(start)
    .command(stop)
    .command(restart)
}
