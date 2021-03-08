export const googleSpreadsheetUrlRegex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
export const extractGoogleSpreadsheetIdFromUrl = url => url.match(googleSpreadsheetUrlRegex)[1];
