var _ = require('underscore');

function compile(template, data) {
  return _.template(template, data);
}

module.exports = function () {

  return {

    extension: 'jst'

  , compile: compile

  };

};
