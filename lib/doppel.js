var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , async = require('async')
  , glob = require('glob')
  , cpr = require('./cpr')
  , engines = require('./engines')
  , supportedEngines = ''
  , engineNames
  , doppel;

function InvalidEngineError(engineName) {
  Error.captureStackTrace(this);

  engineNames || (engineNames = Object.keys(engines));
  if (!supportedEngines) {
    engineNames.forEach(function (engine) {
      supportedEngines += util.format('  * %s\n', engine);
    });
  }

  this.message = engineName ?
    'The ' + engineName + ' template engine is not supported.\n\n' :
    '`doppel.use` must be called with a supported template engine prior to ' +
    '`doppel` being called.\n\n';
  this.message += util.format('Supported engines include:\n%s', supportedEngines);
}

util.inherits(InvalidEngineError, Error);

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
  cpr(src, dest, function (err) {
    if (err) callback(err);

    // Compile all template files in the copied directory.
    glob(
      util.format('%s/**/*.%s', dest, extension)
    , function (err, files) {
        if (err) return callback(err);
        else if (files.length === 0) return callback();

        var EXTENSION_RE = new RegExp('\\.' + extension + '$');

        async.forEach(
          files
        , function (file, iteratorCallback) {
            fs.readFile(file, 'utf8', function (err, template) {
              if (err) return iteratorCallback(err);

              var writeStream = fs.createWriteStream(
                    file
                  , { encoding: 'utf8' }
                  )
                , compiled = engine.compile(template, data)
                , buffer = new Buffer(compiled);

              function moveFile() {
                var newPath = file.replace(EXTENSION_RE, '');

                writeStream.end();

                fs.rename(file, newPath, iteratorCallback);
              }

              writeStream.once('error', iteratorCallback);

              // Once the entire compiled template has been written, rename
              // the file to remove the template file extension.
              if (!writeStream.write(buffer)) {
                writeStream.once('drain', moveFile);
              }
              else {
                moveFile();
              }
            });
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
};

module.exports = doppel;
