const buildTemplateFromFile = require('./controller/templates').buildFromFile
const buildPlugin = require('./controller/wpPlugin').build
const buildElements = require('./controller/elements').build
const program = require('commander')
const settings = require('./sources/settings')
const fs = require('fs-extra')
program
  .version('0.0.1')
  .command('template <jsonFile>')
  .description('Build template directory from json file.')
  .option('-t, --title <s>', 'Add title to template')
  .option('-d, --descr <s>', 'Add description to template')
  .option('-i, --id <n>', 'Add id to template')
  .option('-o, --output <s>', 'Path to output template bundle')
  .action((jsonFile, options) => {
    buildTemplateFromFile(jsonFile, options.title, options.descr, options.id, options.output)
  })
program.command('plugin')
  .description('Build VCWB Wordpress plugin zip archive')
  .option('-p, --path <s>', 'Path where to create zip file')
  .option('-r, --repository <s>', 'Set repo for VCWB. Default: ' + settings.repo)
  .option('-c, --builderCommit <s>', 'Select commit SHA1 for VCWB')
  .action((options) => {
    buildPlugin(options.path, options.repository || settings.repo, options.builderCommit)
  })
program.command('elements')
  .description('Build VCWB elements bundle zip archive')
  .option('-p, --path <s>', 'Path where to create zip file')
  .option('-r, --repository <s>', 'Set repo for VCWB. Default: ' + settings.repo)
  .option('-ar, --accountRepository <s>', 'Set repo for Account. Default: ' + settings.accountRepo)
  .option('-e, --elementsJSON <s>', 'Set JSON file path for a list of elements.')
  .option('-c, --builderCommit <s>', 'Select commit SHA1 for VCWB')
  .action((options) => {
    const elements = options.elementsJSON ? fs.readJsonSync(options.elementsJSON, { throws: false }) : settings.bundleElements
    buildElements(options.path, options.repository || settings.repo, options.accountRepository || settings.accountRepo, elements, options.builderCommit)
  })
program.parse(process.argv)
