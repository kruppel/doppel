var util = require('util')
  , engines = require('./../engines')
  , supportedEngines = ''
  , engineNames;

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

module.exports = InvalidEngineError;
