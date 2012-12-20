var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , glob = require('glob')
  , async = require('async');

/**
 * Compares two files for string equivalency of contents.
 *
 * @param {String} actual Absolute path to first file
 * @param {String} expected Absolute path to second file
 * @param {Function} callback Invoked with an error if file contents are
 *                            different or with no arguments if file contents
 *                            are equivalent
 */
exports.assertFilesEqual = function (actual, expected, callback) {

  async.parallel({
    actual: async.apply(fs.readFile, actual)
  , expected: async.apply(fs.readFile, expected)
  }, function (err, results) {
    if (err) return callback(err);

    if (results.actual.toString() !== results.expected.toString()) {
      callback(
        new Error(
          'expected contents of ' + actual + ' to equal contents of ' + expected
        )
      );
    }
    else {
      callback();
    }
  });

};

/**
 * Compares two directories for equivalency of contents, ignoring
 * empty subdirectories.
 *
 * @param {String} actual Absolute path to first directory
 * @param {String} expected Absolute path to second directory
 * @param {Function} callback Invoked with an error if directory contents are
 *                            different or with no arguments if contents are
 *                            equivalent
 */
exports.assertDirsEqual = function (actual, expected, callback) {

  var self = this;

  async.parallel({
    actualFiles: async.apply(glob, actual + '/**/*')
  , expectedFiles: async.apply(glob, expected + '/**/*')
  }, function (err, results) {
    if (err) return callback(err);

    var onlyInExpected
      , onlyInActual
      , expectedRelative
      , actualRelative
      , actualFiles = results.actualFiles
      , expectedFiles = results.expectedFiles;

    // Before comparing file contents, ensure we have the same set of files.
    actualRelative = _.map(actualFiles, function (file) {
      return path.relative(actual, file);
    });

    expectedRelative = _.map(expectedFiles, function (file) {
      return path.relative(expected, file);
    });

    onlyInExpected = _.difference(expectedRelative, actualRelative);
    onlyInActual = _.difference(actualRelative, expectedRelative);

    if (onlyInExpected.length > 0) {
      return callback(new Error('actual should contain: ' + onlyInExpected));
    }

    if (onlyInActual.length > 0) {
      return callback(new Error('actual should not contain: ' + onlyInActual));
    }

    // Now compare the file contents
    async.forEach(expectedFiles, function (expectedFile, iteratorCallback) {

      fs.stat(expectedFile, function (err, stats) {
        var actualFile;

        if (err) return iteratorCallback(err);

        if (!stats.isFile()) return iteratorCallback();

        actualFile = path.resolve(
          actual
        , path.relative(expected, expectedFile)
        );

        exports.assertFilesEqual(actualFile, expectedFile, iteratorCallback);
      });

    }, callback);

  });

};
