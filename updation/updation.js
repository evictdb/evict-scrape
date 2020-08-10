import pkg from 'google-spreadsheet';
const {
  GoogleSpreadsheet
} = pkg;
import moment from 'moment';
import fs from 'fs';
import {
  CliArgumentError,
  processCommandLineArguments
} from './cli-util.js';
import { readJsonSourceFiles } from './readJsonSourceFiles.js';

const localeDate = dateString => moment(dateString, 'MM/DD/YYYY');
const caseDatesInitialValue = cases => ({
  start: localeDate(cases[0]['Filed']),
  end: localeDate(cases[0]['Filed'])
});
const caseDatesReducer = (lastDates, aCase) => {
  const thisDate = localeDate(aCase['Filed']);
  return {
    start: moment.min(lastDates.start, thisDate),
    end: moment.max(lastDates.end, thisDate)
  };
}

const updateMetadata = async (sheet, timestamp, start, end, cases) => {
  await sheet.loadCells();
  const a1 = sheet.getCell(0, 0);
  const b1 = sheet.getCell(1, 0);
  const b2 = sheet.getCell(1, 1);
  const c1 = sheet.getCell(2, 0);
  const c2 = sheet.getCell(2, 1);
  const d1 = sheet.getCell(3, 0);
  const d2 = sheet.getCell(3, 1);
  const e1 = sheet.getCell(4, 0);
  const e2 = sheet.getCell(4, 1);
  a1.value = 'Alachua County Eviction Cases';
  b1.value = 'Updated:';
  b2.value = moment().format();
  c1.value = 'Retrieved:';
  c2.value = timestamp.format();
  d1.value = 'File dates:';
  d2.value = `${start.format('MM/DD/YYYY')} thru ${end.format('MM/DD/YYYY')}`;
  e1.value = 'Total cases:';
  e2.value = cases.length;
  await sheet.saveUpdatedCells();
};

const main = async () => {

  try {
    const { googleSpreadsheetId, googleCredentialsFile, jsonSourceFiles, ...options } = processCommandLineArguments();

    if (options.verbose) console.log(`Reading ${jsonSourceFiles.length} data files...`);
    const cases = readJsonSourceFiles(jsonSourceFiles);
    if (options.verbose) console.log(`Number of cases: ${cases.length}`);

    const greatestTimestamp = moment(cases.reduce((a, c) => a > c["Time Stamp"] ? a : c["Time Stamp"], cases[0]["Time Stamp"]));
    if (options.verbose) console.log(`Latest Time Stamp: ${greatestTimestamp.format()}`);

    const headers = Object.keys(cases[0]);
    if (options.verbose) {
      console.group(`Headers from json file:`);
      console.log(headers);
      console.groupEnd();
    }

    const {
      start,
      end
    } = cases.reduce(caseDatesReducer, caseDatesInitialValue(cases));
    if (options.verbose) console.log(`Data Start and End Dates: ${start.format('MM/DD/YYYY')} - ${end.format('MM/DD/YYYY')}`);

    if (options.verbose) console.log(`Removing extra line breaks from Dockets...`);
    for (let index = 0; index < cases.length; index++) {
      const aCase = cases[index];
      aCase['Dockets'] = aCase['Dockets'].replace(/\n(?!\d\d\/\d\d\/\d\d\d\d)/gm, ' ');
    }

    if (options.verbose) console.log(`Sorting cases`);
    cases.sort((a, b) => a['Case Number'].localeCompare(b['Case Number']) * -1);

    if (options.verbose) console.log(`Opening Spreadsheet...`);
    const doc = new GoogleSpreadsheet(googleSpreadsheetId);
    await doc.useServiceAccountAuth(JSON.parse(fs.readFileSync(googleCredentialsFile)));

    await doc.loadInfo();
    const newSpreadsheetTitle = `Alachua County Eviction Cases ${start.format('MM/DD/YYYY')}-${end.format('MM/DD/YYYY')}`;
    if (options.verbose) console.log(`Setting spreadsheet title to '${newSpreadsheetTitle}'`);
    if (!options.dryRunOnly) {
      await doc.updateProperties({
        title: newSpreadsheetTitle
      });
    }

    if (options.verbose) console.log(`Reading through individual sheets in Spreadsheet...`);
    for (let index = 0; index < doc.sheetsByIndex.length; index++) {
      const sheet = doc.sheetsByIndex[index];
      if (sheet.title === 'Metadata') {
        if (options.verbose) console.log(`Found Metadata sheet - Updating...`);
        if (!options.dryRunOnly) await updateMetadata(sheet, greatestTimestamp, start, end, cases);
      }
      if (sheet.title === 'Eviction Cases') {
        if (options.verbose) console.log(`Found Eviction Cases sheet - Deleting...`);
        if (!options.dryRunOnly) await sheet.delete();
      }
    }

    if (options.verbose) console.log(`Adding new Eviction Cases sheet...`);
    if (!options.dryRunOnly) {
      const sheet = await doc.addSheet({
        title: 'Eviction Cases',
        headerValues: headers
      });
      const rows = await sheet.addRows(cases);
    }

  } catch (error) {
    if (error instanceof CliArgumentError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
}

main()


