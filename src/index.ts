/**
 * @OnlyCurrentDoc
 */

/**
 * Kicks off the entire process.
 * - Opens the linked spreadsheet.
 * - Loads the config values from the spreadsheet.
 * - Loads and parses the MHW event schedule from the website.
 * - Merges the event data that was fetched into the spreadsheet.
 */
function main(): void {
  const sheet = new SpreadsheetManager();
  sheet.load();
}

/**
 * Adds the custom MHW menu to the spreadsheet.
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('MHW').addItem('Update', 'main').addToUi();
}
