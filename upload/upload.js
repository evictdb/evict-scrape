const { GoogleSpreadsheet } = require('google-spreadsheet');
const moment = require('moment');

const localeDate = dateString => moment(dateString, 'MM/DD/YYYY');
const caseDatesInitialValue = cases => ({start: localeDate(cases[0]['Filed']), end: localeDate(cases[0]['Filed'])});
const caseDatesReducer = (lastDates, aCase) => {
  thisDate = localeDate(aCase['Filed']);
  return { start: moment.min(lastDates.start, thisDate), end: moment.max(lastDates.end, thisDate) };
}

const updateMetadata = async (sheet, timestamp, start, end, cases) => {
  await sheet.loadCells();
  const a1 = sheet.getCell(0, 0);
  const b1 = sheet.getCell(1, 0);
  const c1 = sheet.getCell(2, 0);
  const d1 = sheet.getCell(3, 0);
  const e1 = sheet.getCell(4, 0);
  a1.value = 'Alachua County Eviction Cases';
  b1.value = `Uploaded ${moment().format()}`;
  c1.value = `Data Last Retrieved from website on ${timestamp.format()}`;
  d1.value = `File dates from ${start.format('MM/DD/YYYY')} thru ${end.format('MM/DD/YYYY')}`;
  e1.value = `Total cases: ${cases.length}`;
  await sheet.saveUpdatedCells();
};

const main = async () => {
  // Load Data
  const cases = require('./cases_flat.json');
  const greatestTimestamp = moment(cases.reduce((a, c) => a > c["Time Stamp"] ? a : c["Time Stamp"], cases[0]["Time Stamp"]));
  const headers = Object.keys(cases[0]);

  const { start, end } = cases.reduce(caseDatesReducer, caseDatesInitialValue(cases));

  for (let index = 0; index < cases.length; index++) {
    const aCase = cases[index];
    aCase['Dockets'] = aCase['Dockets'].replace(/\n(?!\d\d\/\d\d\/\d\d\d\d)/gm, ' ');
  }
  cases.sort((a,b)=>a['Case Number'].localeCompare(b['Case Number'])*-1);

  // const doc = new GoogleSpreadsheet('1ocmIPGYEsGCSEJewMv6d-8dbfB2keLqCHBoEZ313o5M');
  // const doc = new GoogleSpreadsheet('1SjIdat9659Dq3qa_XQTSSDfUa7nOCVrhbWzLY16yRJ0');
  const doc = new GoogleSpreadsheet('16tQMwSdIBuTGUDlPwqZpm61SjuSvEJ5N0sn8gd8B-xc');
  await doc.useServiceAccountAuth(require('./creds-from-google.json'));

  await doc.loadInfo();
  await doc.updateProperties({ title: `Alachua County Eviction Cases ${start.format('MM/DD/YYYY')}-${end.format('MM/DD/YYYY')}` });

  for (let index = 0; index < doc.sheetsByIndex.length; index++) {
    const sheet = doc.sheetsByIndex[index];
    if (sheet.title === 'Metadata') await updateMetadata(sheet, greatestTimestamp, start, end, cases);
    if (sheet.title === 'Eviction Cases') await sheet.delete();
  }
  const sheet = await doc.addSheet({ title: 'Eviction Cases', headerValues: headers });
  const rows = await sheet.addRows(cases);
};

main();


