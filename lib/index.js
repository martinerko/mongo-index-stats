'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _statistics = require('./statistics');

var _statistics2 = _interopRequireDefault(_statistics);

var _report = require('./report');

var _report2 = _interopRequireDefault(_report);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * mongo-index-stats
 * Copyright(c) 2017 martinerko <martinerko@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

exports.default = {
  calculateStatistics: _statistics2.default,
  generateReport: _report2.default
};
module.exports = exports['default'];