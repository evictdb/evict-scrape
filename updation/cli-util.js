import minimist from 'minimist';
import path from 'path';
import fs from 'fs';
import assert from 'assert';
import {
  googleSpreadsheetUrlRegex,
  extractGoogleSpreadsheetIdFromUrl
} from './google-spreadsheet-util.js';

export class CliArgumentError extends Error {
  constructor(message) {
    super(`CLI Argument Error: ${message}`);
  }
}

const minimistOptions = {
  string: ['credentials', 'worksheet-url', 'worksheet-id'],
  boolean: ['overwrite', 'verbose', 'help', 'dry-run'],
  alias: {
    o: 'overwrite',
    v: 'verbose',
    h: 'help',
    creds: 'credentials',
    url: 'worksheet-url',
    id: 'worksheet-id',
  },
  stopEarly: true,
};

export const showHelp = () => console.log(`Usage: ${process.argv[0]} ${process.argv[1]} --credentials <Google-Credentials> <Spreadsheet-Identification> [Options...] Data-Files...

Updates a Google Spreadsheet with data from one or more JSON files using the specified credentials.
`);

const validateArguments = argv => {
  assert.ok(argv['worksheet-id'] || argv['worksheet-url'], new CliArgumentError(`One of 'worksheet-id' or 'worksheet-url' argument is required`));

  if (argv['worksheet-url']) {
    assert.ok(!argv['worksheet-id'], new CliArgumentError(`The 'worksheet-id' and 'worksheet-url' arguments are mutually exclusive`));
    assert.match(argv['worksheet-url'], googleSpreadsheetUrlRegex, new CliArgumentError(`Not a recognized Google worksheet url - ${argv['worksheet-url']}`));
  }

  assert.ok(argv.credentials, new CliArgumentError(`Credentials argument is required`));
  assert.ok(fs.existsSync(argv.credentials), new CliArgumentError(`Credentials file [${argv.credentials}] does not exist`));

  argv._.forEach(file => {
    assert.strictEqual(path.extname(file), '.json', new CliArgumentError(`File ${file} expected to have '.json' extension.`));
    assert.ok(fs.existsSync(file), new CliArgumentError(`File does not exist: ${file}`));
  });
};

const applyArguments = argv => ({
  googleSpreadsheetId: argv['worksheet-id'] || extractGoogleSpreadsheetIdFromUrl(argv['worksheet-url']),
  googleCredentialsFile: argv.credentials,
  jsonSourceFiles: argv._,
  overwrite: !!argv.overwrite,
  verbose: !!argv.verbose,
  dryRunOnly: !! argv['dry-run'],
});

export const processCommandLineArguments = () => {
  const argv = minimist(process.argv.slice(2), minimistOptions);
  if (argv.help) {
    showHelp();
  }
  validateArguments(argv);
  const processedArguments = applyArguments(argv);
  if (processedArguments.verbose) {
    console.group('Command line arguments:');
    console.log(processedArguments);
    console.groupEnd();
  }
  if (argv.help) {
    process.exit(0);
  }
  return processedArguments;
}
