// TODO: dump this version now that we have working puppeteer version

const fs = require('fs');
const path = require('path');
const moment = require('moment');

const jsonFormat = data => JSON.stringify(data, null, 2);

const unitConversion = {
  y: 'years',
  q: 'quarters',
  m: 'months',
  w: 'weeks',
  d: 'days',
};

const computeConfiguration = cliArguments => ({
  startDate: cliArguments.startDate,
  endDate: cliArguments.startDate && moment(cliArguments.endDate),
  increment: cliArguments.startDate && cliArguments.increment || 1,
  incrementUnits: cliArguments.startDate && cliArguments.increment && cliArguments.incrementUnits || 'weeks',
});

const defaultFolder = runStart => `EvictScrape_${moment(runStart).format()}`;
const runDataFilename = 'run_data.json';
const batchDataFilename = (batchId, start, end) => `batch_data_${batchId.toString().padStart(3, '0')}_from_${start}_thru_${end}.json`;
const casesFilename = "cases.json";
const flatCasesFilename = "cases_flat.json";

const writeProgress = (runData, batch, batchData) => {
  const { cases, ...shallowCloneNoCases } = runData;
  const dataFile = path.join(runData.configuration.folder, runDataFilename);
  const backup = `${dataFile}.prev`;
  if (batch !== undefined) {
    fs.writeFileSync(path.join(runData.configuration.folder, batch.fileName), jsonFormat(batchData));
  }
  if (fs.existsSync(dataFile)) fs.renameSync(dataFile, backup);
  fs.writeFileSync(dataFile, jsonFormat(shallowCloneNoCases));
}

const getValidBatchFile = (runData, batch) => {
  if (fs.existsSync(path.join(runData.configuration.folder, batch.fileName))) {
    return JSON.parse(fs.readFileSync(path.join(runData.configuration.folder, batch.fileName)));
  }
  return undefined;
}

const writeFullCaseDataFile = (folder, cases) => {
  console.log("Writing full case data...");
  fs.writeFileSync(path.join(folder, casesFilename), jsonFormat(cases));
}

const writeFlattenedCaseDataFile = (folder, cases) => {
  console.log("Writing flattened data...");

  const flattened = cases.map(c => ({
    "Case Number": c.number,
    "Filed": c.filed,
    "Status": c.status,
    "Summary": c.summary,
    "Action": c.action,
    "Residence": c.defendants.filter(x => x.name && x.res_addr).map(x => x.res_addr + ", " + x.res_csz).find(x => x && x.trim() !== ","),
    "Plaintiffs": c.plaintiffs.map(x => x.name).join("\n"),
    "Defendants": c.defendants.map(x => x.name).join("\n"),
    "Total Costs": c.costTotals.owed,
    "Total Due": c.costTotals.due,
    "Dockets": c.dockets.map(d => d.date + ' ' + d.text).join("\n"),
    "Web Link": c.url,
    "Time Stamp": c.timeStamp,
  }));

  fs.writeFileSync(path.join(folder, flatCasesFilename), jsonFormat(flattened));
};

const searchResultColumns = ["Party", "Affl", "Party Type", "DOB", "Case Status",	"Case Number", "Case URL"];


module.exports = {
  'Scrape Alachua Clerk of Court' : async function (browser) {
    const { error, dryRun, noScrape, ...cliArguments } = processCliArguments();
    if (error) browser.assert.fail(error);

    console.group('Command Line Arguments');
    console.log(jsonFormat(cliArguments));
    console.groupEnd();

    const startOfRun = moment();
    const runData = {};
    folder = cliArguments.folder !== undefined ? cliArguments.folder : defaultFolder(runData.startMs);
    if (folder && fs.existsSync(path.join(folder, runDataFilename))) {
      console.log('Existing run file detected.');
      const { transientConfiguration, ...existingRunData } = JSON.parse(fs.readFileSync(path.join(folder, runDataFilename)));
      Object.assign(runData, existingRunData, {cases: []});
    } else {
      console.log('Preparing new run.');
      Object.assign(runData, {
        timeStamp: startOfRun.format(),
        cliArguments,
        configuration: computeConfiguration(cliArguments),
        batches: [],
        cases: []
      });
    }

    Object.assign(runData, {
      startMs: startOfRun,
      transientConfiguration: { dryRun, noScrape },
    });

    if (runData.batches && runData.batches.length) {
      console.log('Using existing batches.');
      runData.transientConfiguration.useExistingBatchData = true;
    } else {
      if (runData.configuration.startDate) {
        console.log('Preparing automated batches.');
        const runEndDate = moment(runData.configuration.endDate).startOf('date');
        const runStartDate = moment(runData.configuration.startDate).startOf('date');
        const increment = moment.duration(runData.configuration.increment, runData.configuration.incrementUnits);
        for (let id = 0, batchStartDate = runStartDate; batchStartDate.isSameOrBefore(runEndDate, 'days'); ++id, batchStartDate.add(increment)) {
          const fullIncrement = moment(batchStartDate).add(increment).subtract(1, 'days');
          const batchEndDate = moment.min(fullIncrement, runEndDate);
          const startDate = batchStartDate.format('YYYY-MM-DD');
          const endDate = batchEndDate.format('YYYY-MM-DD');
          runData.batches.push({
            id,
            type: 'auto',
            startDate,
            endDate,
            fileName: batchDataFilename(id, startDate, endDate),
          });
        }
      } else {
        console.log('No Start Date Specified - setting up for a single manual batch');
        runData.batches.push({ id: 0, type: 'manual' })
      }
    }

    if (dryRun) {
      const { cases, ...shallowCloneNoCases } = runData;
      console.group('Dry Run Requested.  Initial State:');
      console.log(shallowCloneNoCases);
      console.groupEnd();
      wrapUp(browser);
      return;
    }

    fs.mkdirSync(folder, {recursive: true});
    runData.configuration = {...runData.configuration, folder};
    writeProgress(runData);

    const createParty = caseRecord => ({
      party: caseRecord["Party"],
      affl: caseRecord["Affl"],
      type: caseRecord["Party Type"],
    });

    const caseRecordReducer = (cases, caseRecord) => {
      const existingCase = cases.find(c => c.number === caseRecord["Case Number"]);
      if (existingCase) {
        existingCase.parties.push(createParty(caseRecord));
      } else {
        cases.push({
          number: caseRecord["Case Number"],
          status: caseRecord["Case Status"],
          url: caseRecord["Case URL"],
          parties: [createParty(caseRecord)],
          timeStamp: runData.timeStamp,
        });
      }
      return cases;
    }

    browser.url('https://www.alachuaclerk.org/court_records/index.cfm');
    browser.waitForElementVisible('#captcha')
    browser.click('#captcha')
    browser.waitForManualAction("Type CAPTCHA Text on browser -- DO NOT SUBMIT!!")
    browser.click('#LoginForm input[type=submit]')
    await browser.waitForElementVisible('#contents')

    const numberOfBatches = runData.batches.length;
    console.group(`Processing ${numberOfBatches} batch${numberOfBatches == 1 ? '' : 'es'}...`);
    for (let index = 0; index < numberOfBatches; index++) {
      const batch = runData.batches[index];
      let batchCases = [];
      const oldBatchCases = getValidBatchFile(runData, batch);
      if (runData.transientConfiguration.useExistingBatchData && oldBatchCases) {
        console.log(`Batch ${index + 1} of ${numberOfBatches}: Using existing ${oldBatchCases.length} cases from ${batch.fileName}`);
        batchCases = oldBatchCases;
      } else {
        batch.startTimeMs = moment();
        batch.performance = [];
        const batchHeader = `Batch ${index + 1} of ${numberOfBatches}: ${batch.startDate} thru ${batch.endDate}`;
        console.group(batchHeader);
        if(!runData.transientConfiguration.noScrape) {

//          browser.url('https://www.alachuaclerk.org/court_records/gis/')
          browser.url('https://www.alachuaclerk.org/court_records/index.cfm');
          await browser.waitForElementVisible('#contents')

          await browser.click('#contents a[href="gis/"]')
          await browser.waitForElementVisible('#GISForm select[name=CaseType]')
          await browser.click('#GISForm select[name="CaseType"] option[value="CCLT"]')

          if (batch.type === 'manual') {
            console.log("No Start Date Specified - Manual Search Parameters Required.")
            browser.waitForManualAction("Edit Search Criteria on browser -- DO NOT SUBMIT!!")
          } else {
            await browser.clearValue('#StartFileDate');
            await browser.setValue('#StartFileDate', moment(batch.startDate).format('MM/DD/YYYY'));
            await browser.clearValue('#EndFileDate');
            await browser.setValue('#EndFileDate', moment(batch.endDate).format('MM/DD/YYYY'));
          }
          browser.click('#GISForm input[type=submit]')
browser.waitForManualAction('1')
          browser.waitForElementVisible('#contents')
          browser.url('https://www.alachuaclerk.org/court_records/gis/index.cfm?section=results&viewall=y')

          browser.waitForElementVisible('#contents');
browser.waitForManualAction('2')

          const data = await browser.elements('css selector', 'tr.result_data,tr.result_data_alt');

          if (data.value) {
            const result = await Promise.all(data.value.map(async (row) => {
              const cells = await browser.elementIdElements(row.ELEMENT, 'css selector', 'td');
              const link = await browser.elementIdElement(cells.value[5].ELEMENT, 'css selector', 'a');
              return Promise.all([
                ...cells.value.map(async (cell) => await browser.elementIdText(cell.ELEMENT)),
                browser.elementIdAttribute(link.value.ELEMENT, "href")
              ]);
            }));
            const cleanResult = result.map(r => {
              const cols = r.map(c => c.value);
              return ({
                [searchResultColumns[0]]: cols[0],
                [searchResultColumns[1]]: cols[1],
                [searchResultColumns[2]]: cols[2],
                [searchResultColumns[3]]: cols[3],
                [searchResultColumns[4]]: cols[4],
                [searchResultColumns[5]]: cols[5],
                [searchResultColumns[6]]: cols[6],
                timeStamp: runData.timeStamp,
              });
            });
            console.log(cleanResult.length, "case records found");

            const cases = cleanResult.reduce((cases, caseRecord) => caseRecordReducer(cases, caseRecord), []);

            console.log(cases.length, "unique cases found");

            // go through the cases and get some details

            for (let index = 0; index < cases.length; index++) {
              const aCase = cases[index];
              console.log("Processing case " + (index + 1) + " of " + cases.length + "... ");

              const caseUrl = new URL(aCase.url);
              aCase.p = caseUrl.searchParams.get('p');

              const summaryURL = "https://www.alachuaclerk.org/court_records/gis/index.cfm?section=summary&p=" + aCase.p;
              await browser.url(summaryURL);
              await browser.waitForElementVisible('#contents');
              aCase.summary = (await browser.getText({
                locateStrategy: 'css selector',
                selector: "#contents > div:nth-child(2) > table:nth-child(1) > tbody > tr:nth-child(1) > td",
                timeout: 250,
                suppressNotFoundErrors: true,
              })).value;
              aCase.action = (await browser.getText({
                locateStrategy: "xpath",
                selector: '//*[@id="contents"]/div/table/tbody/tr[td/text()="Action"]/following-sibling::tr[1]/td',
                timeout: 250,
                suppressNotFoundErrors: true,
              })).value;
              aCase.filed = (await browser.getText({
                locateStrategy: "xpath",
                selector: '//*[@id="contents"]/div/table/tbody/tr/td/table/tbody/tr/td[strong/text()="Filed"]/following-sibling::td[1]',
                timeout: 250,
                suppressNotFoundErrors: true,
              })).value;
              aCase.incomplete = (await browser.getText({
                locateStrategy: "xpath",
                selector: '//*[@id="contents"]/div/table/tbody/tr/td/table/tbody/tr/td[strong/text()="Incomplete"]/following-sibling::td[1]',
                timeout: 250,
                suppressNotFoundErrors: true,
              })).value;

              const docketURL = "https://www.alachuaclerk.org/court_records/gis/index.cfm?section=docket_list&p=" + aCase.p;
              await browser.url(docketURL);
              await browser.waitForElementVisible('#contents');
              const docketElements = await browser.elements('css selector', 'tr.result_data,tr.result_data_alt');
              aCase.dockets = [];
              if (docketElements.value) {
                const docketsRaw = await Promise.all(docketElements.value.map(async (row) => {
                  const cells = await browser.elementIdElements(row.ELEMENT, 'css selector', 'td');
                  if (!cells.value.length || cells.value.length < 5) return Promise.resolve(null);
                  const link = await browser.elementIdElement(cells.value[4].ELEMENT, 'css selector', 'a');
                  const record = {
                    date: (await browser.elementIdText(cells.value[0].ELEMENT)).value,
                    text: (await browser.elementIdText(cells.value[1].ELEMENT)).value,
                    amount: (await browser.elementIdText(cells.value[2].ELEMENT)).value,
                    due: (await browser.elementIdText(cells.value[3].ELEMENT)).value,
                    link: link.value.ELEMENT && (await browser.elementIdAttribute(link.value.ELEMENT, "href")).value
                  }
                  return Promise.resolve(record);
                }));
                aCase.dockets.push(...(docketsRaw.filter(e => e)));
              }

              const costsURL = "https://www.alachuaclerk.org/court_records/gis/index.cfm?section=costs&p=" + aCase.p;
              await browser.url(costsURL);
              await browser.waitForElementVisible('#contents');
              const costsElements = await browser.elements("xpath", '//*[@id="contents"]/div/table/tbody/tr[td/b/text()="Total Fees:"]/td');
              if (costsElements.value) {
                aCase.costTotals = {
                  owed: (await browser.elementIdText(costsElements.value[1].ELEMENT)).value,
                  paid: (await browser.elementIdText(costsElements.value[2].ELEMENT)).value,
                  dismissed: (await browser.elementIdText(costsElements.value[3].ELEMENT)).value,
                  due: (await browser.elementIdText(costsElements.value[4].ELEMENT)).value,
                }
              }

              const partiesURL = "https://www.alachuaclerk.org/court_records/gis/index.cfm?section=party_list&p=" + aCase.p;
              await browser.url(partiesURL);
              await browser.waitForElementVisible('#contents');
              const partyListElements = await browser.elements('css selector', 'tr.result_data,tr.result_data_alt');
              aCase.plaintiffs = [];
              aCase.defendants = [];
              if (partyListElements.value) {
                const partiesRaw = await Promise.all(partyListElements.value.map(async (row) => {
                  const cells = await browser.elementIdElements(row.ELEMENT, 'css selector', 'td');
                  if (!cells.value.length || cells.value.length < 5) return Promise.resolve(null);
                  const linkElement = await browser.elementIdElement(cells.value[0].ELEMENT, 'css selector', 'a');
                  const name = linkElement.value.ELEMENT && (await browser.elementIdText(linkElement.value.ELEMENT)).value
                  const link = linkElement.value.ELEMENT && (await browser.elementIdAttribute(linkElement.value.ELEMENT, "href")).value
                  const type = (await browser.elementIdText(cells.value[2].ELEMENT)).value
                  return Promise.resolve({name, link, type});
                }));
                const getPartyAddress = async (party) => {
                  if (!party.link)
                    return party;
                  await browser.url(party.link);
                  await browser.waitForElementVisible('#contents');
                  const res_addr = (await browser.getText({
                    locateStrategy: "xpath",
                    selector: '//*[@id="contents"]/div/table/tbody/tr[td[contains(.,"RESIDENCE ADDRESS")]]/following-sibling::tr[1]/td[1]/table/tbody/tr[1]/td[2]',
                    timeout: 250,
                    suppressNotFoundErrors: true,
                  })).value;
                  const res_csz = (await browser.getText({
                    locateStrategy: "xpath",
                    selector: '//*[@id="contents"]/div/table/tbody/tr[td[contains(.,"RESIDENCE ADDRESS")]]/following-sibling::tr[1]/td[1]/table/tbody/tr[2]/td[2]',
                    timeout: 250,
                    suppressNotFoundErrors: true,
                  })).value;
                  const mail_addr = (await browser.getText({
                    locateStrategy: "xpath",
                    selector: '//*[@id="contents"]/div/table/tbody/tr[td[contains(.,"MAILING ADDRESS")]]/following-sibling::tr[1]/td[1]/table/tbody/tr[1]/td[2]',
                    timeout: 250,
                    suppressNotFoundErrors: true,
                  })).value;
                  const mail_csz = (await browser.getText({
                    locateStrategy: "xpath",
                    selector: '//*[@id="contents"]/div/table/tbody/tr[td[contains(.,"MAILING ADDRESS")]]/following-sibling::tr[1]/td[1]/table/tbody/tr[2]/td[2]',
                    timeout: 250,
                    suppressNotFoundErrors: true,
                  })).value;
                  return { ...party, res_addr, res_csz, mail_addr, mail_csz };
                };
                const plaintiffs = partiesRaw.filter(e => e && e.type.includes('PLAINTIFF'));
                for (let pindex = 0; pindex < plaintiffs.length; pindex++) {
                  console.log("  Getting "+(pindex+1)+" of "+plaintiffs.length+" plaintiffs...");
                  aCase.plaintiffs.push(plaintiffs[pindex]);
                }
                const defendants = partiesRaw.filter(e => e && e.type.includes('DEFENDANT'));
                for (let dindex = 0; dindex < defendants.length; dindex++) {
                  console.log("  Getting "+(dindex+1)+" of "+defendants.length+" defendants...");
                  aCase.defendants.push(await getPartyAddress(defendants[dindex]));
                }
              }
            }

            batchCases = cases;

          } else {
            console.log('No Data Found.');
          }
        }
        console.groupEnd();
        batch.endTimeMs = moment();
        writeProgress(runData, batch, batchCases);
      }
      runData.cases.push(...batchCases);
    }
    console.groupEnd();

    console.log("Sorting...");
    runData.cases.sort((a,b)=>a.number.localeCompare(b.number));

    writeFullCaseDataFile(runData.configuration.folder, runData.cases);
    writeFlattenedCaseDataFile(runData.configuration.folder, runData.cases);

    runData.endTimeMs = moment();
    writeProgress(runData);

    // wait to go
    wrapUp(browser);
  }
}

const invalidDateCliArgumentMessage = dateLabel => value => `Invalid ${dateLabel} date argument: ${value}`;
const incrementValidation = value => ({
  value: Number(value),
  error: /^\d+$/.test(value) ? undefined : new Error(`Invalid increment argument: ${value}`),
});
const incrementUnitsValidation = value => {
  const properUnits = value => unitConversion[value] || (/^(years|quarters|months|weeks|days)$/.test(value) && value);
  const units = properUnits(value.trim().toLowerCase());
  return {
    value: units,
    error: units ? undefined : new Error(`Invalid increment units argument: ${value}`),
  };
}

function wrapUp(browser) {
  browser.waitForManualAction("Hit Enter to exit");
  browser.end();
}

function processCliArguments() {
  const result = {};
  for (let argumentIndex = 2; !result.error && argumentIndex < process.argv.length; argumentIndex++) {
    switch (process.argv[argumentIndex]) {
      case '--folder': {
        const { value: folder , error } = processCliArgument(++argumentIndex);
        Object.assign(result, {folder, error});
        break;
      }
      case '--dry-run': {
        Object.assign(result, {dryRun: true});
        break;
      }
      case '--no-scrape': {
        Object.assign(result, {noScrape: true});
        break;
      }
      case '--start-date': {
        const { date: startDate , error } = processDateCliArgument(++argumentIndex, invalidDateCliArgumentMessage('start'));
        Object.assign(result, {startDate, error});
        break;
      }
      case '--end-date': {
        const { date: endDate, error } = processDateCliArgument(++argumentIndex, invalidDateCliArgumentMessage('end'));
        Object.assign(result, {endDate, error});
        break;
      }
      case '--increment': {
        const { value: increment, error } = processCliArgument(++argumentIndex, incrementValidation);
        Object.assign(result, {increment, error});
        if (!error) {
          const { value: incrementUnits , error } = processCliArgument(++argumentIndex, incrementUnitsValidation);
          Object.assign(result, {incrementUnits, error});
        }
        break;
      }
    }
  }
  return validateArguments(result);
}

const validateArguments = arguments => arguments;

const processDateCliArgument = (argumentPosition, errorMessageGenerator) => {
  const { value , error } = processCliArgument(argumentPosition);
  if (error) return { error };
  const simpleDate = moment(value, 'MM/DD/YYYY', true);
  if (simpleDate.isValid()) return { date: simpleDate };
  const defaultDate = moment(value);
  return defaultDate.isValid() ? { date: defaultDate } : { error: new Error(errorMessageGenerator(value)) };
};

const notEnoughArgumentsError = { error: new Error('Ran short of arguments when processing CLI') };
const isNotEnoughArguments = argumentPosition => argumentPosition >= process.argv.length;
const validatedValue = (validator, value) => validator ? validator(value) : { value };
const processCliArgument = (argumentPosition, validator) => isNotEnoughArguments(argumentPosition) ? notEnoughArgumentsError : validatedValue(validator, process.argv[argumentPosition]);

