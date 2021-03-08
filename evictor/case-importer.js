import fs from 'fs';
import CourtCaseRepo, { defaultDatabaseFilePath } from './court-case-repository.js';
import commander from 'commander';

const program = commander.program;
const newCommand = new commander.Command();

const withJsonFiles = (jsonFiles, action) => jsonFiles.map(
  jsonFile => action(JSON.parse(fs.readFileSync(jsonFile)))
);

const importCourtCases = courtCases => courtCases.forEach(courtCase => importCourtCase(courtCase));

const convertToDatabaseSchema = webCourtCase => {
  const {
    number: caseNumber,
    status,
    url,
    summary,
    action,
    fileDate,
    incomplete,
    timeStamp: firstRetrieved,
    timeStamp: lastUpdate,
    timeStamp: lastVerified,
    costTotals: {
      owed,
      paid,
      dismissed,
      due,
    }
  } = webCourtCase;
  return {
    courtCase: {
      caseNumber,
      status,
      url,
      summary,
      action,
      fileDate,
      incomplete,
      firstRetrieved,
      lastUpdate,
      lastVerified,
    },
    courtCaseCost: {
      owed,
      paid,
      dismissed,
      due,
      firstRetrieved,
      lastUpdate,
      lastVerified,
    },
    courtCaseDockets: webCourtCase.dockets.map(({
      date,
      text,
      amount,
      due,
      link,
    }) => ({
      date,
      text,
      amount,
      due,
      link,
      firstRetrieved,
      lastUpdate,
      lastVerified,
    })),
    courtCaseParties: combinePartyData(webCourtCase),
  }
};

const importCourtCase = async webCourtCase => {
  const dbCourtCase = convertToDatabaseSchema(webCourtCase);
  const result = await CourtCaseRepo.courtCase.upsert(dbCourtCase.courtCase);
  dbCourtCase.courtCaseCost.courtCaseId = result.id;
  const results = await Promise.all([
    CourtCaseRepo.courtCaseCost.upsert(dbCourtCase.courtCaseCost),
    CourtCaseRepo.courtCaseDockets.sync(result.id, dbCourtCase.courtCaseDockets),
    CourtCaseRepo.courtCaseParties.sync(result.id, dbCourtCase.courtCaseParties),
  ]);
};

const main = () => {
  program
    .option('--debug', 'output extra debugging info')
    .option('-d, --database <file-path>', 'database file path', defaultDatabaseFilePath)
    .option('-f, --files <json-files...>', 'court case json files to import');

  program.parse(process.argv);

  if (program.debug) {
    console.group('Selected Options:');
    console.log(JSON.stringify(program.opts(), null, 2));
    console.groupEnd();
  }

  CourtCaseRepo.initialize(program.database);
  withJsonFiles(program.files, importCourtCases);
};

main();
