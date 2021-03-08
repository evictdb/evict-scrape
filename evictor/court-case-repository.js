import sqlite3 from 'sqlite3';
import * as sqlite from 'sqlite';
import path from 'path';

export const defaultDatabaseFilePath = `.${path.sep}evictorData.db`;

export class RepositoryUninitializedError extends Error {
  constructor (message, ...rest) {
    super(`Repository Uninitialized: ${message || 'initialize repository before attempting operation'}`, ...rest);
  }
}

const config = {};
const statements = {};

const iifDb = action => (...args) => {
  if (config.db) {
    return action(...args);
  } else throw new RepositoryUninitializedError;
}

const initialize = async databaseFile => {
  config.db = await sqlite.open({
    filename: ( databaseFile || defaultDatabaseFilePath ),
    driver: sqlite3.Database,
  });
  statements.getCourtCaseByNumber = await config.db.prepare(
    `SELECT id,
       caseNumber,
       status,
       url,
       summary,
       [action],
       fileDate,
       incomplete,
       firstRetrieved,
       lastUpdate,
       lastVerified
     FROM CourtCase
     WHERE caseNumber = ?;`
  );
};

const getCourtCaseByNumber = async caseNumber => statements.getCourtCaseByNumber.all(caseNumber);

export default {
  initialize,
  getCourtCaseByNumber: iifDb(getCourtCaseByNumber),
};
