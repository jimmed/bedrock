/**
 * TODO
 *  - Look into using jest TestEnvironments for process management, etc.
 *    https://facebook.github.io/jest/docs/en/configuration.html#testenvironment-string
 **/

module.exports = {
  collectCoverage: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/config/']
}
