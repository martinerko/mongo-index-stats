'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ejs = require('ejs');

var _ejs2 = _interopRequireDefault(_ejs);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Constants
 */

/**
 * mongo-index-stats
 * Copyright(c) 2017 martinerko <martinerko@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var REPORT_TEMPLATE = _path2.default.resolve(__dirname, '..', 'template/index.ejs');

var debug = (0, _debug2.default)('mongo-index-stats:report');

/**
 * Generate raw html report including charts and data.
 *
 * @param  {Object}   data Statistics map with data grouped by collection name.
 * @param  {Function} cb   Callback to be executed with error or raw html data.
 * @return {undefined}
 * @api public
 */
var generateReport = function generateReport(data, cb) {
  debug('reading report template ' + REPORT_TEMPLATE);
  _fs2.default.readFile(REPORT_TEMPLATE, 'utf8', function (err, template) {
    if (err) {
      cb(err);
    } else {
      try {
        debug('rendering raw html report');
        var htmlRenderized = _ejs2.default.render(template, {
          collectionNames: Object.keys(data).sort(),
          data: data
        });
        cb(null, htmlRenderized);
      } catch (errRender) {
        cb(errRender);
      }
    }
  });
};

exports.default = generateReport;
module.exports = exports['default'];