var util = require('util')
  , async = require('async')
  , glob = require('glob')
  , cpr = require('./cpr')
  , engines = require('./engines')
  , Template = require('./template')
  , InvalidEngineError = require('./errors').InvalidEngine
  , doppel;

/**
 * "Doppel" - copy and compile - a directory of templates.
 *
 * @param {string} src source directory path (can be relative)
 * @param {string} dest destination directory path (can be relative)
 * @param {object} data interpolation data/context
 * @param {Function} callback
 *
 * @example
 *   doppel.use('underscore');
 *   doppel('from', 'to', { test: 'data' }, function (err) {
 *     if (err) return console.error(err);
 *
 *     console.log('done');
 *   });
 */
doppel = function (src, dest, data, callback) {
  var engine = doppel.engine
    , extension;

  if (!engine) {
    return callback(new InvalidEngineError());
  }

  extension = engine.extension;

  // Recursively copy the source directory into the given destination.
  cpr.cpr(src, dest, function (err) {
    if (err) return callback(err);

    // Compile all template files in the copied directory.
    var g = new glob.Glob(
      util.format('%s/**/*.%s', dest, extension)
    , undefined
    , function (err, files) {
        if (err) return callback(err);
        else if (files.length === 0) return callback();

        async.forEach(
          files
        , function (file, iteratorCallback) {
            var template = Template.forEngine(engine, file);

            template.compile(data, iteratorCallback);
          }
        , callback
        );
      }
    );
  });
};

/**
 * Sets active template engine for compilation
 *
 * @param {string} name template engine name
 * @param {object} [options]
 */
doppel.use = function (name, options) {
  var engine = engines[name];

  if (!engine) throw new InvalidEngineError(name);

  doppel.engine = engine();

  options || (options = {});
  options.extension && (doppel.engine.extension = options.extension);

  return this;
};

module.exports = doppel;
