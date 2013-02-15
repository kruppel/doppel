var util = require('util');

function InvalidDestError() {
  Error.captureStackTrace(this, InvalidDestError);

  this.message = util.format('Destination path must be provided.');
}

util.inherits(InvalidDestError, Error);

module.exports = InvalidDestError;
