var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , commands = require('./commands')
  , errors = require('./errors')
  , InvalidDestError = errors.InvalidDest
  , InvalidSrcError = errors.InvalidSrc
  , IdenticalDirsError = errors.IdenticalDirs
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
  if (!dest) return callback(new InvalidDestError());
  else if (!src) return callback(new InvalidSrcError());

  var cwd = process.cwd()
    , resolvedSrc = path.resolve(cwd, src)
    , resolvedDest = path.resolve(cwd, dest);

  async.waterfall(
    [
      function (next) {
        fs.exists(resolvedSrc, function (exists) {
          next(exists ?
               undefined :
               new InvalidSrcError(resolvedSrc));
        });
      }
    , function (next) {
        if (resolvedSrc === resolvedDest) {
          return next(new IdenticalDirsError(resolvedSrc, resolvedDest));
        }
        else if (resolvedSrc.indexOf(resolvedDest) === 0) {
          return next(new InvalidDestError(resolvedDest, resolvedSrc));
        }

        return next();
      }
    , function (next) {
        var rimraf = commands['rm -rf'];

        rimraf(resolvedDest, next);
      }
    , function (next) {
        var mkdirp = commands['mkdir -p'];

        mkdirp(resolvedDest, next);
      }
    , function (destDir, next) {
        fs.readdir(resolvedSrc, next);
      }
    , function (files, next) {
        if (files.length === 0) return next();

        async.forEach(
          files
        , function (file, done) {
            var oldPath = path.join(resolvedSrc, file)
              , newPath = path.join(resolvedDest, file);

            // prevents infinite recursion when copying cwd
            if (oldPath === resolvedDest) return done();

            fs.stat(oldPath, function (err, fstat) {
              if (err) return done(err);

              if (fstat.isDirectory()) {
                cpr.cpr(oldPath, newPath, done);
              }
              else {
                cp.cp(oldPath, newPath, done);
              }
            });
          }
        , next
        );
      }
    ]
  , callback
  );
};

/**
 * Synchronous version of `cpr`
 *
 * @param {string} src source directory
 * @param {string} dest destination directory
 */
cpr.sync = function (src, dest) {
  if (!dest) throw new InvalidDestError();
  else if (!src) throw new InvalidSrcError();

  var rimraf = commands['rm -rf']
    , mkdirp = commands['mkdir -p']
    , cwd = process.cwd()
    , resolvedSrc = path.resolve(cwd, src)
    , resolvedDest = path.resolve(cwd, dest)
    , exists
    , files
    , copied;

  exists = fs.existsSync(resolvedSrc);
  if (!exists) {
    throw new InvalidSrcError(resolvedSrc);
  }
  else if (resolvedSrc === resolvedDest) {
    throw new IdenticalDirsError(resolvedSrc, resolvedDest);
  }

  rimraf.sync(resolvedDest);
  mkdirp.sync(resolvedDest);

  files = fs.readdirSync(resolvedSrc);

  files.forEach(function (file) {
    var oldPath = path.join(resolvedSrc, file)
      , newPath = path.join(resolvedDest, file)
      , fstat = fs.statSync(oldPath);

    // prevents infinite recursion when copying cwd
    if (oldPath === resolvedDest) return;

    if (fstat.isDirectory()) {
      cpr.sync(oldPath, newPath);
    }
    else {
      cp.sync(oldPath, newPath);
    }
  });
};

module.exports = cpr;
