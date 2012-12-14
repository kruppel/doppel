var _ = require('underscore');

module.exports = function () {

  return {

    extension: 'jst'

  , compile: function (template, data) {
      return _.template(template, data);
    }

  };

};
