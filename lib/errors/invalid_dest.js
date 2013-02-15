var util = require('util');

function InvalidDestError(dest, src) {
  Error.captureStackTrace(this, InvalidDestError);

  if (dest && src) {
    this.message = util.format(
      'Destination path %s cannot be parent of source directory %s.'
    , dest
    , src
    );
  } else {
    this.message = util.format('Destination path must be provided.');
  }
}

util.inherits(InvalidDestError, Error);

module.exports = InvalidDestError;
