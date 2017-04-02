'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeDir = require('node-dir');

var _nodeDir2 = _interopRequireDefault(_nodeDir);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Constants
 */

var DEFAULT_DATA_SOURCE = _path2.default.resolve(__dirname, '../data'); /* eslint import/no-dynamic-require: "off" */
/* eslint global-require: "off" */

/**
 * mongo-index-stats
 * Copyright(c) 2017 martinerko <martinerko@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var REG_DATE_FOLDERS = /^\d{4}-\d{2}-\d{2}$/;
var REG_COLLECTION_NAME = /\.json$/;

var debug = (0, _debug2.default)('mongo-index-stats:statistics');
var basename = _path2.default.basename;
var mergeWith = _lodash2.default.mergeWith;

var DATA_SOURCE = void 0; // will be set to default or user defined value
_bluebird2.default.promisifyAll(_nodeDir2.default);

/**
 * Resolve dates represented by directory names in data source.
 * @return {Promise<Array>}   Promise with list of dates.
 * @api private
 */

var resolveExportedDates = function resolveExportedDates() {
  debug('resolving dates based on data source structure');
  return _nodeDir2.default.subdirsAsync(DATA_SOURCE).then(function (subdirs) {
    return subdirs.map(function (dirPath) {
      return basename(dirPath);
    });
  }).then(function (subdirs) {
    return subdirs.filter(function (dirName) {
      return dirName.match(REG_DATE_FOLDERS);
    });
  });
};

/**
 * Resolve collection names exported on given date.
 *
 * @param {String} date
 * @return {Promise<Array>}   Promise with list of collection names.
 * @api private
 */

var resolveExportedCollectionNames = function resolveExportedCollectionNames(date) {
  debug('resolving list of collections exported on ' + date);
  return _nodeDir2.default.filesAsync(_path2.default.resolve(DATA_SOURCE, date)).then(function (files) {
    return files.map(function (fileName) {
      return basename(fileName);
    });
  }).then(function (files) {
    return files.filter(function (fileName) {
      return fileName.match(REG_COLLECTION_NAME);
    });
  });
};

/**
 * Convert passed index statistics into more convenient format.
 *
 * @param  {Object} item      Statistics object.
 * @param  {String} date      Date that will be added into outputed object.
 * @return {Object}
 * @api private
 */

var formatIndexDetails = function formatIndexDetails(item, date) {
  return {
    date: date, // explicitly store date, so we can directly merge this object
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

var getCollectionStatistics = function getCollectionStatistics(colection, date) {
  debug('collecting statistics from ' + date + ' about collection ' + colection);
  // load statistics about given collection and date into memory
  var stats = require(_path2.default.resolve(DATA_SOURCE, date, colection));
  return stats.map(function (s) {
    return formatIndexDetails(s, date);
  });
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

var collectStatistics = function collectStatistics(date) {
  debug('collecting statistics about all collections from ' + date);
  return resolveExportedCollectionNames(date).then(function (collections) {
    return collections.reduce(function (result, collection) {
      /* eslint-disable no-param-reassign */
      result[collection.replace(REG_COLLECTION_NAME, '')] = getCollectionStatistics(collection, date);
      /* eslint-enable no-param-reassign */
      return result;
    }, {});
  });
};

/**
 * Collect and then merge statistics by date.
 *
 * @param  {Array} dates      List of dates.
 * @return {Promise<Object>}  Promise with map containing statistics grouped by date.
 * @api private
 */

var collectStatisticsByDates = function collectStatisticsByDates(dates) {
  debug('collecting statistics for provided dates:\n * ' + dates.join('\n * '));
  return _bluebird2.default.props(dates.reduce(function (result, date) {
    /* eslint-disable no-param-reassign */
    result[date] = collectStatistics(date);
    /* eslint-enable no-param-reassign */
    return result;
  }, {}));
};

/*
 * Customizer for lodash mergeWith method that concats arrays
 */
var customizer = function customizer(objValue, srcValue) {
  if (_lodash2.default.isArray(objValue)) {
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

var mergeStatisticsByCollections = function mergeStatisticsByCollections(statsByDate) {
  debug('merging statistics by collection names');
  return Object.keys(statsByDate) //
  .reduce(function (result, date) {
    return mergeWith(result, statsByDate[date], customizer);
  }, {});
};

/**
 * Calculates statistics about index usage based on data stored in DATA_SOURCE folder.
 *
 * @param  {String|Function} sourceDir       Path to source directory or callback method
 * @param  {Function} callback               Callback method
 * @return {undefined}
 * @api public
 */
var calculateStatistics = function calculateStatistics(sourceDir, callback) {
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

  resolveExportedDates().then(collectStatisticsByDates).then(mergeStatisticsByCollections).then(function (stats) {
    return callback(null, stats);
  }).catch(callback);
};

exports.default = calculateStatistics;
module.exports = exports['default'];