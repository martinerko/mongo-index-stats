/* eslint import/no-dynamic-require: "off" */
/* eslint global-require: "off" */

/**
 * mongo-index-stats
 * Copyright(c) 2017 martinerko <martinerko@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import dir from 'node-dir';
import _ from 'lodash';
import path from 'path';
import createDebug from 'debug';
import Promise from 'bluebird';

/**
 * Constants
 */

const DEFAULT_DATA_SOURCE = path.resolve(__dirname, '../data');
const REG_DATE_FOLDERS = /^\d{4}-\d{2}-\d{2}$/;
const REG_COLLECTION_NAME = /\.json$/;

const debug = createDebug('mongo-index-stats:statistics');
const basename = path.basename;
const mergeWith = _.mergeWith;

let DATA_SOURCE; // will be set to default or user defined value
Promise.promisifyAll(dir);

/**
 * Resolve dates represented by directory names in data source.
 * @return {Promise<Array>}   Promise with list of dates.
 * @api private
 */

const resolveExportedDates = () => {
  debug('resolving dates based on data source structure');
  return dir.subdirsAsync(DATA_SOURCE)
    .then(subdirs => subdirs.map(dirPath => basename(dirPath)))
    .then(subdirs => subdirs.filter(dirName => dirName.match(REG_DATE_FOLDERS)));
};

/**
 * Resolve collection names exported on given date.
 *
 * @param {String} date
 * @return {Promise<Array>}   Promise with list of collection names.
 * @api private
 */

const resolveExportedCollectionNames = (date) => {
  debug(`resolving list of collections exported on ${date}`);
  return dir.filesAsync(path.resolve(DATA_SOURCE, date))
    .then(files => files.map(fileName => basename(fileName)))
    .then(files => files.filter(fileName => fileName.match(REG_COLLECTION_NAME)));
};

/**
 * Convert passed index statistics into more convenient format.
 *
 * @param  {Object} item      Statistics object.
 * @param  {String} date      Date that will be added into outputed object.
 * @return {Object}
 * @api private
 */

const formatIndexDetails = (item, date) => {
  return {
    date, // explicitly store date, so we can directly merge this object
    ops: item.accesses.ops, // total operations since last restart
    name: item.name // name of the index
  };
};

/**
 * Return statistics about indaxe usage for given date and collection.
 *
 * @param  {String} colection
 * @param  {String} date
 * @return {Array}            Array of statistics objects.
 * @api private
 */

const getCollectionStatistics = (colection, date) => {
  debug(`collecting statistics from ${date} about collection ${colection}`);
  // load statistics about given collection and date into memory
  const stats = require(path.resolve(DATA_SOURCE, date, colection));
  return stats.map(s => formatIndexDetails(s, date));
};

/**
 * Collect statistics about all collections exported on given date.
 *
 * @param  {String} date
 * @return {Promise<Object>}  Promise with map containing statistics for all collections.
 * @example
 * // returns {
 * //   "col1" : [
 * //     {"name": "_id_","ops": 10, "date":"2017-03-01"},
 * //     {"name": "code_-1", "ops":1, "date":"2017-03-01"}
 * //   ],
 * //   "col2" : [
 * //     {"name": "_id_","ops": 10, "date":"2017-03-01"},
 * //     {"name": "code_-1", "ops":1, "date":"2017-03-01"}
 * //   ]
 * //  }
 * @api private
 */

const collectStatistics = (date) => {
  debug(`collecting statistics about all collections from ${date}`);
  return resolveExportedCollectionNames(date)
    .then(collections => collections.reduce((result, collection) => {
      /* eslint-disable no-param-reassign */
      result[collection.replace(REG_COLLECTION_NAME, '')] = getCollectionStatistics(collection, date);
      /* eslint-enable no-param-reassign */
      return result;
    }, {}));
};

/**
 * Collect and then merge statistics by date.
 *
 * @param  {Array} dates      List of dates.
 * @return {Promise<Object>}  Promise with map containing statistics grouped by date.
 * @api private
 */

const collectStatisticsByDates = (dates) => {
  debug(`collecting statistics for provided dates:
 * ${dates.join('\n * ')}`);
  return Promise.props(dates.reduce((result, date) => {
    /* eslint-disable no-param-reassign */
    result[date] = collectStatistics(date);
    /* eslint-enable no-param-reassign */
    return result;
  }, {}));
};

/*
 * Customizer for lodash mergeWith method that concats arrays
 */
const customizer = (objValue, srcValue) => {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
  return undefined;
};

/**
 * Merge statistics by date.
 *
 * @param  {Object} statsByDate
 * @return {Object}           Map containing statistics grouped by collection name.
 * @api private
 */

const mergeStatisticsByCollections = (statsByDate) => {
  debug('merging statistics by collection names');
  return Object.keys(statsByDate) //
    .reduce((result, date) => mergeWith(result, statsByDate[date], customizer), {});
};

/**
 * Calculates statistics about index usage based on data stored in DATA_SOURCE folder.
 *
 * @param  {String|Function} sourceDir       Path to source directory or callback method
 * @param  {Function} callback               Callback method
 * @return {undefined}
 * @api public
 */
const calculateStatistics = (sourceDir, callback) => {
  /* eslint-disable no-param-reassign */
  if (typeof sourceDir === 'function') {
    callback = sourceDir;
    sourceDir = DEFAULT_DATA_SOURCE;
  } else if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  if (typeof sourceDir !== 'string') {
    throw new Error('sourceDir must be a string');
  } else {
    DATA_SOURCE = sourceDir;
  }
  /* eslint-enable no-param-reassign */

  resolveExportedDates()
    .then(collectStatisticsByDates)
    .then(mergeStatisticsByCollections)
    .then(stats => callback(null, stats))
    .catch(callback);
};

export default calculateStatistics;
