enum EventTag {
  New = 'New',
  PS4 = 'PS4',
  Xbox = 'Xbox',
  Collab = 'Collab',
}

/**
 * A utility for reading the MHW schedule pages and parsing them into usable event data.
 */
class MHWEventLoader {
  private readonly originalUrl = 'http://game.capcom.com/world/steam/us/schedule.html?utc=0';
  private readonly masterRankUrl =
    'http://game.capcom.com/world/steam/us/schedule-master.html?utc=0';
  private readonly tagRules: Record<EventTag, (el: Cheerio) => boolean> = {
    [EventTag.New]: (el) => el.hasClass('new'),
    [EventTag.PS4]: (el) => el.find('.ps4').length > 0,
    [EventTag.Xbox]: (el) => el.find('.xbox').length > 0,
    [EventTag.Collab]: (el) => el.hasClass('sc'),
  };

  public constructor(private config: MHWEventConfig) {}

  /**
   * Loads all events from the MHW schedules.
   *
   * @returns A list of parsed events.
   */
  public loadEvents(): MHWEvent[] {
    const originalQuests = this.getQuestsForUrl(this.originalUrl);
    const masterRankQuests = this.getQuestsForUrl(this.masterRankUrl);
    return originalQuests.concat(masterRankQuests);
  }

  /**
   * Given a url to the MHW schedule, returns a list of parsed events.
   *
   * @param url The url to the MHW schedule.
   * @returns A list of parsed events from the given schedule.
   */
  private getQuestsForUrl(url: string): MHWEvent[] {
    const txt = UrlFetchApp.fetch(url, {
      contentType: 'text/html',
    }).getContentText();
    const $ = Cheerio.load(txt);
    const tz = this.processTz($);
    const questEls: Cheerio = $('.t1, .t2, .t3');
    const quests = questEls
      .toArray()
      .map((e) => this.processEvent($(e), tz))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .reduce<MHWEvent[]>((acc, val) => {
        if (acc.some((i) => i.title === val.title)) return acc;
        return [...acc, val];
      }, [])
      .filter((i) => i.tags.every((t) => !this.config.ignoreTags.has(t)));
    return quests;
  }

  /**
   * Determines which timezone the values in the document are in, and returns it in the format: `±hh:mm`
   *
   * @param $ The root node of the document.
   * @returns The timezone in ISO8601 format.
   */
  private processTz($: CheerioStatic) {
    const tzRaw = $('.terms').first().children().first().text();
    const tzMatch = tzRaw.match(/.*?\(UTC(.*?)\).*?/);
    if (!tzMatch) throw new Error("Can't parse tz, raw value: " + tzRaw);
    const tz =
      tzMatch[1] === ''
        ? 'Z'
        : tzMatch[1].length === 3
        ? `${tzMatch[1]}:00`
        : `${tzMatch[1].charAt(0)}0${tzMatch[1].charAt(1)}:00`;
    return tz;
  }

  /**
   * Given a single event element, returns the parsed data for that event.
   *
   * @param el The element to parse.
   * @param tz The timezone of the document.
   * @returns A data structure represent the event.
   */
  private processEvent(el: Cheerio, tz: string): MHWEvent {
    const title = el.find('.title').first().children().first().text();
    const description = el
      .find('.quest')
      .first()
      .find('.txt')
      .text()
      .replace(/\n/gi, ' ')
      .replace(/\s\s+/gi, ' ');
    const level = this.processLevel(el.find('.level').first().children().first().text());
    const [startDate, endDate] = el
      .find('.term')
      .filter('td')
      .children()
      .first()
      .find('.txt')
      .first()
      .children()
      .first()
      .text()
      .split('〜')
      .map((i) => this.processDate(i, tz, this.config.timezone));
    const tags = Object.entries(this.tagRules)
      .map(([tag, rule]) => (rule(el) ? tag : undefined))
      .filter((i) => i !== undefined) as string[];
    const result = { title, description, level, startDate, endDate, tags };
    return result;
  }

  /**
   * Parses a date string from the document and returns a date string in the user's preferred timezone.
   *
   * @param text The string datetime to parse.
   * @param tz The timezone that the document was in.
   * @param targetTz The timezone the user would like the result to be in.
   */
  private processDate(text: string, tz: string, targetTz: string) {
    const [dt, time] = text.split(' ');
    const [mon, day] = dt.split('/');
    const [hr, min] = time.split(':');
    const yr =
      new Date().getFullYear() + (parseInt(mon, 10) >= 10 && new Date().getMonth() <= 1 ? -1 : 0);
    const isoDate = `${yr}-${mon}-${day}T${hr}:${min}:00${tz}`;
    const date = new Date(isoDate);
    const fmt = Utilities.formatDate(date, targetTz, 'MM/dd/yyyy hh:mma');
    return fmt;
  }

  /**
   * Parses the rank of the event.
   *
   * @param text The rank value from the document.
   * @returns The rank of the event in a more concise form.
   */
  private processLevel(text: string) {
    const level = text.replace('★', '');
    if (level.indexOf('MR') === -1) {
      return level + '★';
    } else {
      return level.replace('MR ', '') + '✪';
    }
  }
}
