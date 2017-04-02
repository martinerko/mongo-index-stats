/**
 * mongo-index-stats
 * Copyright(c) 2017 martinerko <martinerko@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import createDebug from 'debug';

/**
 * Constants
 */

const REPORT_TEMPLATE = path.resolve(__dirname, '..', 'template/index.ejs');

const debug = createDebug('mongo-index-stats:report');

/**
 * Generate raw html report including charts and data.
 *
 * @param  {Object}   data Statistics map with data grouped by collection name.
 * @param  {Function} cb   Callback to be executed with error or raw html data.
 * @return {undefined}
 * @api public
 */
const generateReport = (data, cb) => {
  debug(`reading report template ${REPORT_TEMPLATE}`);
  fs.readFile(REPORT_TEMPLATE, 'utf8', (err, template) => {
    if (err) {
      cb(err);
    } else {
      try {
        debug('rendering raw html report');
        const htmlRenderized = ejs.render(template, {
          collectionNames: Object.keys(data).sort(),
          data
        });
        cb(null, htmlRenderized);
      } catch (errRender) {
        cb(errRender);
      }
    }
  });
};

export default generateReport;
