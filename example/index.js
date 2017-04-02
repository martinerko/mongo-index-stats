/* eslint no-console: ["error", { allow: ["error"] }] */

/**
 * mongo-index-stats
 * Copyright(c) 2017 martinerko <martinerko@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const opn = require('opn');
const lib = require('../lib');

/**
 * constants
 */

const REPORT = path.resolve(__dirname, 'report.html');
const OPN_OPTIONS = {
  wait: false
};

// I don't like callback hell, do you?
Promise.promisifyAll(lib);
Promise.promisifyAll(fs);

/*
 * example of usage
 */

lib.calculateStatisticsAsync('./data') // calculate statistics about index usage
  .then(lib.generateReportAsync) // generate report
  .then(fs.writeFileAsync.bind(null, REPORT)) // save report on filesystem
  .then(opn.bind(null, REPORT, OPN_OPTIONS)) // open it in the browser
  .catch(console.error);
