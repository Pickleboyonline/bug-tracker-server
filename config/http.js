/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */
// const parse = require('url').parse;
const path = require('path');
const route = require('path-match')({
  sensitive: false,
  strict: false,
  end: false,
})
module.exports.http = {
  trustProxy: true,
  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'reactRouter',
      'router',
      'www',
      'favicon',
    ],


    reactRouter: async (req, res, next) => {
      if (req.method !== 'GET') return next();
      let pathName = req.path;
      let match1 = route('/dashboard');
      let match2 = route('/dashboard/*');
      let match3 = route('/auth')


      if (match1(pathName) || match2(pathName) || match3(pathName)) {
        return res.sendFile(path.join(__dirname, '..', 'assets', 'index.html'));
      }

      return next()

    }

    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

  },

};
