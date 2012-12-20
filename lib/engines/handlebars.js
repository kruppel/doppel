var Handlebars = require('handlebars');

function compile(template, data) {
  return Handlebars.compile(template)(data);
}

module.exports = function () {

  return {

    extension: 'handlebars'

  , compile: compile

  };

};
