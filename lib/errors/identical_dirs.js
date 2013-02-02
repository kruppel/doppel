var util = require('util');

function IdenticalDirsError(dir1, dir2) {
  Error.captureStackTrace(this, IdenticalDirsError);

  this.message = util.format(
    'Directories %s and %s are identical (not copied).'
  , dir1
  , dir2
  );
}

util.inherits(IdenticalDirsError, Error);

module.exports = IdenticalDirsError;
