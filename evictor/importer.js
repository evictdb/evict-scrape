import parse from "csv-parse";
import fs from 'fs';
import pkg from 'google-spreadsheet';
import moment from 'moment';
import path from 'path';
import {
  CliArgumentError,
  processCommandLineArguments
} from './cli-util.js';
import { readJsonSourceFiles } from './readJsonSourceFiles.js';
const {
  GoogleSpreadsheet
} = pkg;
import sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite';


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

// DB Stuff

const defaultDatabase = `.${path.sep}evictorData.db`;

const prepareDatabase = async databaseFile => {
  const db = await sqlite.open({
    filename: databaseFile,
    driver: sqlite3.Database,
  });
  const tables = await (await db.all(`select name from sqlite_master WHERE type = 'table' ORDER BY name;`)).map(e => e.name);
  console.info(tables);
  if (!tables.includes('ServiceAddress')) {
    console.info(`Creating ServiceAddress table...`);
    await db.exec(`CREATE TABLE ServiceAddress (
                      id INTEGER PRIMARY KEY,
                      address TEXT,
                      city TEXT,
                      latitude REAL,
                      longitude REAL
                    )`);
  }
  console.info(`Creating ServiceAddress indexes...`);
  await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idxServiceAddressAddress ON ServiceAddress (address)`)
  if (!tables.includes('ElectricConsumption')) {
    console.info(`Creating ElectricConsumption table...`);
    await db.exec(`CREATE TABLE ElectricConsumption (
                      id INTEGER PRIMARY KEY,
                      serviceAddressId INTEGER,
                      date DATE,
                      month TEXT,
                      year NUMERIC,
                      kwhConsumption REAL,
                      FOREIGN KEY(serviceAddressId) REFERENCES ServiceAddress(id)
                    )`);
  }
  console.info(`Creating ElectricConsumption indexes...`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idxElectricConsumptionServiceAddressDate ON ElectricConsumption (serviceAddressId, date)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idxElectricConsumptionServiceAddressYearMonth ON ElectricConsumption (serviceAddressId, year, month)`);
  return db;
};

// Main

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
    const { gruConsumption, ...options } = processCommandLineArguments();

    const databaseFile = options.database || defaultDatabase;
    const db = await prepareDatabase(databaseFile);

    console.info(`Creating ServiceAddress prepared statements...`);
    const dbInsertServiceAddress = await db.prepare(
      `INSERT INTO ServiceAddress (address, city, latitude, longitude)
       VALUES ($address, $city, $latitude, $longitude)`
    );
    const dbGetServiceAddress = await db.prepare('SELECT id, address, city, latitude, longitude FROM ServiceAddress WHERE id = ?');
    const dbGetServiceAddressByAddress = await db.prepare('SELECT id, address, city, latitude, longitude FROM ServiceAddress WHERE address = ?');

    console.info(`Creating ElectricConsumption prepared statements...`);
    const dbInsertElectricConsumption = await db.prepare(
      `INSERT INTO ElectricConsumption (serviceAddressId, date, month, year, kwhConsumption)
       VALUES ($serviceAddressId, $date, $month, $year, $kwhConsumption)`
    );
    const dbGetElectricConsumption = await db.prepare('SELECT id, date, year, month, kwhConsumption FROM ElectricConsumption WHERE id = ?');
    const dbGetElectricConsumptionByAddress = await db.prepare(
      `SELECT serviceAddressId, date, year, month, SUM(kwhConsumption) AS kwhConsumption
       FROM ServiceAddress sa
       JOIN ElectricConsumption ec ON sa.id = ec.serviceAddressId
       WHERE sa.address = ?
       GROUP BY serviceAddressId, date`
    );
    const dbGetMonthAverageElectricConsumptionByAddress = await db.prepare(
      `SELECT c.month, AVG(c.kwhConsumption) AS averageKwhConsumption
       FROM
        (SELECT serviceAddressId, year, month, SUM(kwhConsumption) AS kwhConsumption
         FROM ServiceAddress sa
         JOIN ElectricConsumption ec ON sa.id = ec.serviceAddressId
         WHERE sa.address = $address
         GROUP BY serviceAddressId, year, month) c
       GROUP BY c.month`
    );

//    const consumption = new Map();

    if (options.verbose) console.log(`Reading GRU Consumption file ${gruConsumption}...`);
    const parser = fs.createReadStream(gruConsumption).pipe(parse({columns: true}));
    let counter = 0;
    for await (const row of parser) {
//      const existing = consumption.get(row['Service Address']);
//      console.log(row);
      const consumption = {
        $date: moment(row.Date, 'MM/DD/YYYY').format('YYYY-MM-DD'),
        $month: row.Month,
        $year: row.Year,
        $kwhConsumption: Number(row['KWH Consumption']),
      };
//      console.log(consumption);
      const existing = await dbGetServiceAddressByAddress.all(row['Service Address']);
      if (existing.length === 0) {
        const newServiceAddress = await dbInsertServiceAddress.run({
          $address: row['Service Address'],
          $city: row['Service City'],
          $latitude: row['Latitude'],
          $longitude: row['Longitude'],
        });
//        console.log(newServiceAddress);
        const result = await dbInsertElectricConsumption.run({
          ...consumption,
          $serviceAddressId: newServiceAddress.lastID,
        });
      } else {
//        console.log(existing);
        const result = await dbInsertElectricConsumption.run({
          ...consumption,
          $serviceAddressId: existing[0].id,
        });
      }
      counter++;
      if (counter%100 === 0) console.info(`${counter} rows processed`);

      //   existing.values.push({
      //     date: moment(row.Date, 'MM/DD/YYYY').format('YYYY-MM-DD'),
      //     kwhConsumption: Number(row['KWH Consumption']),
      //   });
      //   existing.average = (existing.values.reduce((a, v) => a + v.kwhConsumption, 0)) / existing.values.length;
      // } else {
      //   consumption.set(row['Service Address'], {
      //     latitude: Number(row['Latitude']),
      //     longitude: Number(row['Longitude']),
      //     values: [{
      //       date: moment(row.Date, 'MM/DD/YYYY').format('YYYY-MM-DD'),
      //       kwhConsumption: Number(row['KWH Consumption']),
      //     }],
      //     average: Number(row['KWH Consumption']),
      //   });
      // }
    }


    process.exit();
    const cases = readJsonSourceFiles(jsonSourceFiles);
    if (options.verbose) console.log(`Number of cases: ${cases.length}`);

    const greatestTimestamp = moment(cases.reduce((a, c) => a > c["Time Stamp"] ? a : c["Time Stamp"], cases[0]["Time Stamp"]));
    if (options.verbose) console.log(`Latest Time Stamp: ${greatestTimestamp.format()}`);

    const headers = Object.keys(cases[0]);
    if (options.verbose) {
      console.group(`Headers from json files:`);
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


