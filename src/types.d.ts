/// <reference types="cheerio" />

declare const Cheerio: CheerioAPI;

interface MHWEvent {
  title: string;
  description: string;
  level: string;
  startDate: string;
  endDate: string;
  tags: string[];
}

interface MHWEventConfig {
  timezone: string;
  ignoreTags: Set<string>;
}
