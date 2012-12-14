var Handlebars = require('handlebars');

module.exports = function () {

  return {

    extension: 'handlebars'

  , compile: function (template, data) {
      return Handlebars.compile(template)(data);
    }

  };

};
