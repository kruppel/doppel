var util = require('util');

function InvalidSrcError(src) {
  Error.captureStackTrace(this, InvalidSrcError);

  this.message = src ?
    util.format('Source path %s does not exist.', src) :
    'Source path must be provided.';
}

util.inherits(InvalidSrcError, Error);

module.exports = InvalidSrcError;
