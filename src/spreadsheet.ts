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
    tags: 'Tags',
  } as const;

  public static readonly ConfigKey = {
    timezone: 'Timezone',
    ignoreTags: 'Ignore Tags',
  } as const;
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private readonly colId: Record<keyof typeof SpreadsheetManager.ColumnName, number>;

  constructor() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Events');
    if (!sheet) throw new Error("No sheet named 'Events'.");
    this.sheet = sheet;
    this.colId = Object.entries(SpreadsheetManager.ColumnName).reduce(
      (acc, [key, colName]) => ({
        ...acc,
        [key]: this.getNamedColumnId(this.sheet, colName),
      }),
      {} as any
    );
  }

  /**
   * Loads all data from the MHW event schedule and merges it with the existing data in the spreadsheet.
   */
  public load(): void {
    const config = this.getConfigFromSheet();
    const eventLoader = new MHWEventLoader(config);
    const events = eventLoader.loadEvents();
    for (const event of events) this.loadEvent(event);
  }

  /**
   * Loads a single event from the schedule into the spreadsheet, merging it with existing data.
   * @param event The event data to load into the spreadsheet.
   */
  private loadEvent(event: MHWEvent): void {
    const dataRange = this.sheet.getDataRange();
    const existing = this.sheet
      .getRange(1, this.colId.title, dataRange.getNumRows(), 1)
      .createTextFinder(event.title)
      .findNext();
    const rowIndex = existing ? existing.getRow() : dataRange.getNumRows() + 1;
    for (const key of ['title', 'startDate', 'level', 'endDate', 'description', 'tags'] as const) {
      const cell = this.sheet.getRange(rowIndex, this.colId[key]);
      switch (key) {
        case 'tags':
          cell.setValue(event[key].join(', '));
          break;
        default:
          cell.setValue(event[key]);
      }
    }
    if (existing === null) {
      this.sheet.getRange(rowIndex, this.colId.status).setValue(0);
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
    const keyCol = this.getNamedColumnId(sheet, 'Key');
    const valueCol = this.getNamedColumnId(sheet, 'Value');
    const config = Object.entries(SpreadsheetManager.ConfigKey).reduce((acc, [key, cfgName]) => {
      const found = sheet
        .getRange(1, keyCol, dataRange.getNumRows(), 1)
        .createTextFinder(cfgName)
        .findNext();
      if (!found) throw new Error(`Config key [ ${cfgName} ] not found in sheet`);
      const row = found.getRow();
      const rawValue: string = sheet.getRange(row, valueCol).getValue() ?? '';
      const value = key === 'ignoreTags' ? new Set(rawValue.replace(' ', '').split(',')) : rawValue;
      Logger.log(`Loaded config property ${key}: ${rawValue}`);
      return { ...acc, [key]: value };
    }, {} as MHWEventConfig);
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
