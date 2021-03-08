import minimist from 'minimist';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

export class CliArgumentError extends Error {
  constructor(message) {
    super(`CLI Argument Error: ${message}`);
  }
}

const minimistOptions = {
  string: ['database', 'gru-consumption'],
  boolean: ['verbose', 'help', 'dry-run'],
  alias: {
    v: 'verbose',
    h: 'help',
    db: 'database',
    gru: 'gru-consumption',
  },
  stopEarly: true,
};

export const showHelp = () => console.log(`Consumption: ${process.argv[0]} ${process.argv[1]} --gru-consumption <Consumption-file> [Options...]

Parses a GRU Consumption file.
`);

const validateArguments = argv => {
  assert.ok(argv['gru-consumption'], new CliArgumentError(`'gru-consumption' file argument is required`));
};

const applyArguments = argv => ({
  gruConsumption: argv['gru-consumption'],
  database: argv.database,
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
