module.exports = function (Handlebars, options) {

  options = options || {};

  return {

    extension: options.extension || 'handlebars'

  , compile: function (template, data) {
      return Handlebars.compile(template)(data);
    }

  };

};
