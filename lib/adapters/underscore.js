module.exports = function (_, options) {

  options = options || {};

  return {

    extension: options.extension || 'jst'

  , compile: function (template, data) {
      return _.template(template, data);
    }

  };

};
