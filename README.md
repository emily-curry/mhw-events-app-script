# mhw-events-app-script

A [clasp](https://github.com/google/clasp) project that syncs the MHW event schedule with a linked google sheet document.

## Usage

Open the [published document](https://docs.google.com/spreadsheets/d/1HMNO6UaqLXtqtt7uj-yYb5oR1IxUf34H7b-IOfZta_w/edit?usp=sharing) and do File > Make a Copy to clone the document, which also clones the linked app script project.

To update the sheet, do MHW > Update (this custom menu appears to the right of "Help", and may take a moment to appear). The first time you run this, you will be prompted for access. `script.external_request` is for making HTTP requests to the MHW schedule website, `spreadsheets` is for modifying the linked document.

Some notes:

- The `Key` sheet explains what all the color coding means.
- The `Config` sheet contains user settings.
  - You may change the timezone to your [tz database name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) and the datetime values in the sheet will be updated to match on next update.
  - You may change the list of ignored tags. Events with a tag in this list will be excluded from updates. By default, filters Xbox/PS4 exclusives.
- The `✔` and `Notes` columns can contain whatever you want to put in them. They will not be modified by the script. All other columns will be overwritten on update.
- You may go to Tools > Script Editor to view the (transpiled) source of the script and make any changes you want.
  - Any future changes made to the published script/document will not propagate to your copy.

## Development

You can use the contents of this repo and the [clasp](https://github.com/google/clasp) CLI to have a little nicer of a development experience.

- Follow the [clasp install](https://github.com/google/clasp#install) instructions for setting up the CLI tools.
- Run `pnpm i` to get the project dependencies.
- In the app script editor (which opens when you do Tools > Script Editor from the sheet), do File > Project Properties to get your scriptId, and put that value in `.clasp.json`.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
