exports.command = 'stop <name>'
exports.describe = 'stop an instance'
exports.builder = yargs =>
  yargs.positional('name', {
    describe: 'the name of the instance to stop',
    type: 'string'
  })

exports.handler = argv => console.log(argv)
