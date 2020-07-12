/**
 * Reads and writes to the linked spreadsheet.
 */
class SpreadsheetManager {
  public static readonly ColumnName = {
    title: 'Title',
    level: '★',
    startDate: 'Start',
    endDate: 'End',
    description: 'Description',
    status: '✔',
    notes: 'Notes',
  } as const;

  public static readonly ConfigKey = {
    timezone: 'Timezone',
  } as const;

  /**
   * Loads all data from the MHW event schedule and merges it with the existing data in the spreadsheet.
   */
  public load(): void {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Events');
    if (!sheet) throw new Error("No sheet named 'Events'.");
    const colId: Record<keyof typeof SpreadsheetManager.ColumnName, number> = {} as any;
    for (const key of Object.getOwnPropertyNames(SpreadsheetManager.ColumnName) as Array<
      keyof typeof SpreadsheetManager.ColumnName
    >) {
      colId[key] = this.getNamedColumnId(sheet, SpreadsheetManager.ColumnName[key]);
    }
    const config = this.getConfigFromSheet();
    const eventLoader = new MHWEventLoader(config);
    const events = eventLoader.loadEvents();
    for (const event of events) {
      const dataRange = sheet.getDataRange();
      const found = sheet
        .getRange(1, colId.title, dataRange.getNumRows(), 1)
        .createTextFinder(event.title)
        .findNext();
      const rowIndex = found ? found.getRow() : dataRange.getNumRows() + 1;
      for (const key of ['title', 'startDate', 'level', 'endDate', 'description'] as Array<
        keyof MHWEvent
      >) {
        sheet.getRange(rowIndex, colId[key]).setValue(event[key]);
      }
      if (found === null) {
        sheet.getRange(rowIndex, colId.status).setValue(0);
      }
    }
  }

  /**
   * Loads the "Config" page of the spreadsheet, and returns the values needed by the event loader.
   *
   * @returns A config object needed by the event loader.
   */
  private getConfigFromSheet(): MHWEventConfig {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
    if (!sheet) throw new Error('No sheet named [ Config ]');
    const dataRange = sheet.getDataRange();
    const keys = Object.getOwnPropertyNames(SpreadsheetManager.ConfigKey) as Array<
      keyof typeof SpreadsheetManager.ConfigKey
    >;
    const keyCol = this.getNamedColumnId(sheet, 'Key');
    const valueCol = this.getNamedColumnId(sheet, 'Value');
    const config = keys.reduce<Record<keyof typeof SpreadsheetManager.ConfigKey, string>>(
      (acc, val) => {
        const found = sheet
          .getRange(1, keyCol, dataRange.getNumRows(), 1)
          .createTextFinder(SpreadsheetManager.ConfigKey[val])
          .findNext();
        if (!found)
          throw new Error(`Config key [ ${SpreadsheetManager.ConfigKey[val]} ] not found in sheet`);
        const row = found.getRow();
        return { ...acc, [val]: sheet.getRange(row, valueCol).getValue() };
      },
      {} as any
    );
    return config;
  }

  /**
   * Finds the index of the column who has a value in the first row matching the given string.
   *
   * @param sheet The spreadsheet object to search.
   * @param name The value of the column to find.
   * @returns The index of the found column.
   */
  private getNamedColumnId(sheet: GoogleAppsScript.Spreadsheet.Sheet, name: string): number {
    const width = sheet.getDataRange().getNumColumns();
    const range = sheet.getRange(1, 1, 1, width).createTextFinder(name).findNext();
    if (!range) throw new Error('Could not find text ' + name);
    return range.getColumn();
  }
}
