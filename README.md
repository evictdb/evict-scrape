# evict-scrape #

A thrown together tool to scrape eviction court cases from the Alachua County, Florida Clerk of Court public records website.  The intention is to get the data needed efficiently without violating terms of service or otherwise impacting the court website.

- [evict-scrape](#evict-scrape)
  - [A note about this repository](#a-note-about-this-repository)
  - [Install / Set Up](#install--set-up)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Running the scraper](#running-the-scraper)
    - [The Captcha](#the-captcha)
    - [Manual search options](#manual-search-options)
    - [Scraper output files](#scraper-output-files)
    - [Command Line Options](#command-line-options)
    - [Restarting](#restarting)
  - [Updation utility](#updation-utility)
    - [Google sheets service account](#google-sheets-service-account)
    - [Command line options](#command-line-options-1)
    - [Spreadsheet format](#spreadsheet-format)

## A note about this repository ##

This code is at best experimental and I see it as a first step to explore some ideas about making data more available for the public good.  I am publishing this in order to make the methodology for retrieving this data transparent to any who find that they can make use of it.

## Install / Set Up ##

### Prerequisites ###

* [Node 12 Required](https://nodejs.org/en/download/)

### Installation

* [git clone this repository or download and unpack the zip file](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository)
* Open a terminal window and in the root folder where the repository is unpacked run the following command:
```
    npm install
```

## Running the scraper ##

Once things are set up, the scraper can be run in a terminal window from the root folder using the following command:
```
  npm start
```
Running with no parameters will trigger a single batch run with a manually specified search.  This is explained in detail over the next several sections.  For more information on automated searches see the [Options](#options) section below.

Once started, you will see a browser window pop up and a series of messages informing you as to the progress of the scraper. Things will stop very soon, however, because you will need to solve the captcha.  For more on the captcha, see the next section.

You can quit the process at any time in the terminal window by pressing `<Ctrl>-C`.

### The Captcha ###

Early in the process, the scraper will stop on a 'captcha' screen in the browser and give the following message in the terminal window:
```
  Type CAPTCHA Text on browser
```
The captcha puzzle is intended to block automated processes from overloading the court records or doing other malicious activities.  You as a human will have to solve the captch puzzle in order to let the scraper proceed.

Simply change to the browser window showing the captcha, type in the solution, and then go back to the terminal window and press `<ENTER>` to proceed.

Note, it is preferrable that you not submit the captcha solution by pressing `<ENTER>` in the browser or clicking the submit button, but, if you do, the process will still work and you will just get an extraneous warning at the end.

### Manual search options ###

If no options were provided the scraper will be in manual search mode, meaning you will have to enter the search parameters.  After the captcha is solved, the scraper will proceed to the search page and stop.  A prompt will appear in the terminal window:
```
  No Start Date Specified - Manual Search Parameters Required.
  Edit Search Criteria on browser
```
Switch to the browser window showing the search criteria, edit the fields to create the search you want, and then go back to the terminal window and press `<ENTER>` to proceed.

Like the captcha screen, it is preferrable that you not submit the search by pressing `<ENTER>` in the browser or clicking the submit button, but, if you do, the process will still work and you will just get an extraneous warning at the end.

Depending on the size of the search you specify, it may take a long time to retrieve the data or the search may not return every matching record.  Searches that retrieve more than 900 entries tend to be truncated.  It is best to only search for a week or so of data at a time.

### Scraper output files ###

By default, the scraper puts the output for a singe run into a folder with the prefix `EvictScrape_` with the ISO-8601 formatted date and time appended to it.  This can be changed with the `--folder` option.

Inside the folder, are a number of files:

* Run data json file (and backup)
  ```
  run_data.json
  ```
  This file holds the metadata for the run, including the batches that will be executed, timing data, and configuration.  The `run_data.json` file is saved after each batch is run.  In case a run file somehow gets corrupted as can happen when a run fails, the previously saved data for the prior batch is retained in the file `run_data.json.prev`

* Batch data json files
  ```
  batch_data_<batch-number>_from_<start-date>_thru_<end-date>.json
  ```
  *`batch-number`*
  - The ordinal number of the batch, starting from 0, padded to three digits with `0`'s.

  *`start-date`*
  - The start date of the batch in ISO-8691 date format (YYYY-MM-DD).

  *`end-date`*
  - The end date of the batch in ISO-8691 date  format (YYYY-MM-DD).

  Each batch stores all the cases downloaded during that batch in a json array of objects.

* Case data json file
  ```
  cases.json
  ```
  Detailed case data for all cases in the run.
* Flattened case json file
  ```
  cases_flat.json
  ```
  Summary case data for all cases in the run.

### Command Line Options ###

All command line options are listed below:

  *`--folder <path>`*
  - `<path>` specifies the folder to use instead of the default, which is a folder with the prefix `EvictScrape_` with the ISO-8601 formatted date and time appended to it.
    If the folder has an existing `run_data.json` file then the contents of the folder will be assumed to be a restarted batch.  See Restarting.
  *`--dry-run`*
  - Read the command line options, compute any batches, but do not create any folders or do any scraping.
  *`--no-scrape`*
  - Does everything but actually scrape the data.  Will create folders and empty data files.
  *`--start-date <date>`*
  - Set the start date for automatic batch processing.  Date can be in MM/DD/YYYY or YYYY-MM-DD format.  Batches will be created based on the start date, the end date and the increment.  If no start date is specified and a restart is not being done, then a single manual search batch (as described above) will be created.
  *`--end-date <date>`*
  - Set the end date for automatic batch processing.  Date can be in MM/DD/YYYY or YYYY-MM-DD format.  Default is today.
  *`--increment <number> <units>`*
  - Set the number and units of the batch increment (the length of each batch in time units).  Units are one of `days`, `weeks`, `months`, or `years`.  Default increment is one week.

### Restarting ###
When a folder is specified and a run_data.json file exists in that folder, restart is assumed.  Each batch file that already exists will be skipped.  Only batches that are not already present will be scraped.  The checking is not very smart, so it is best to remove any partial or corrupted batch files before restarting.

## Updation utility ##

### Google sheets service account ###

### Command line options ###

### Spreadsheet format ###
