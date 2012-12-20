var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , commands = require('./commands')
  , cp = {}
  , cpr = {};

/**
 * Copies a single file
 *
 * @param {string} src source directory
 * @param {string} dest destination directory
 * @param {Function} callback
 */
cp.cp = function (src, dest, callback) {
  var readStream = fs.createReadStream(src, { encoding: 'utf8' })
    , writeStream = fs.createWriteStream(dest, { encoding: 'utf8' });

  readStream.on('end', callback);
  readStream.on('error', callback);

  readStream.pipe(writeStream);
};

/**
 * Synchronous version of `cp`
 *
 * @param {string} src source directory
 * @param {string} dest destination directory
 */
cp.sync = function (src, dest) {
  fs.writeFileSync(dest, fs.readFileSync(src, 'utf8'), 'utf8');
};

/**
 * Recursively copies a directory, a la `cp -R`
 *
 * @param {string} src source directory
 * @param {string} dest destination directory
 * @param {Function} callback
 */
cpr.cpr = function (src, dest, callback) {
  var cwd = process.cwd()
    , resolvedDest = path.resolve(cwd, dest)
    , rimraf = commands['rm -rf']
    , mkdirp = commands['mkdir -p'];

  rimraf(resolvedDest, function (err) {
    if (err) return callback(err);

    mkdirp(resolvedDest, function (err) {
      if (err) return callback(err);

      var resolvedSrc = path.resolve(cwd, src);

      fs.readdir(resolvedSrc, function (err, files) {
        if (err) return callback(err);
        else if (files.length === 0) return callback();

        async.forEach(
          files
        , function (file, iteratorCallback) {
            var oldPath = path.join(resolvedSrc, file)
              , newPath = path.join(resolvedDest, file);

            fs.stat(oldPath, function (err, fstat) {
              if (err) return iteratorCallback(err);

              if (fstat.isDirectory()) {
                cpr.cpr(oldPath, newPath, iteratorCallback);
              }
              else {
                cp.cp(oldPath, newPath, iteratorCallback);
              }
            });
          }
        , callback
        );
      });
    });
  });
};

/**
 * Synchronous version of `cpr`
 *
 * @param {string} src source directory
 * @param {string} dest destination directory
 */
cpr.sync = function (src, dest) {
  var rimraf = commands['rm -rf']
    , mkdirp = commands['mkdir -p']
    , cwd = process.cwd()
    , resolvedDest = path.resolve(cwd, dest)
    , resolvedSrc
    , files
    , copied;

  rimraf.sync(resolvedDest);
  mkdirp.sync(resolvedDest);

  resolvedSrc = path.resolve(cwd, src);
  files = fs.readdirSync(resolvedSrc);

  files.forEach(function (file) {
    var oldPath = path.join(resolvedSrc, file)
      , newPath = path.join(resolvedDest, file)
      , fstat = fs.statSync(oldPath);

    if (fstat.isDirectory()) {
      cpr.sync(oldPath, newPath);
    }
    else {
      cp.sync(oldPath, newPath);
    }
  });
};

module.exports = cpr;
