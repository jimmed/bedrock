exports.command = 'restart <name>'
exports.describe = 'restart an instance'
exports.builder = yargs =>
  yargs.positional('name', {
    describe: 'the name of the instance to restart',
    type: 'string'
  })

exports.handler = argv => console.log(argv)
