var path = require('path')
  , util = require('util')
  , _ = require('underscore')
  , handlebars = require('handlebars')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , should = require('chai').should()
  , doppel = require('./../../lib/doppel')
  , fixtures = require('./../fixtures')
  , expected = fixtures.expected
  , adapted = fixtures.adapters
  , assertions = require('./../assertions')
  , options
  , data;

data = {
  test_string: 'testing123'
, list: [ 19, 84, 'Carl Lewis' ]
};

options = {

  handlebars: {
    lib: handlebars
  , extension: 'handlebars'
  , setup: function () {
      handlebars.registerHelper('docify', function (title, options) {
        var out = util.format(
          "<!DOCTYPE html>\n<html>\n<head>\n<title>%s</title>\n</head>\n<body>\n%s\n</body>\n</html>"
        , title
        , options.fn(this)
        );

        return new handlebars.SafeString(out);
      });
      handlebars.registerHelper('embolden', function (text) {
        return new handlebars.SafeString(util.format("<b>%s</b>", text));
      });
      handlebars.registerPartial('testlist', '<ul>{{#each list}}<li>{{this}}</li>{{/each}}</ul>');
    }
  , teardown: function () {
      handlebars.helpers = {};
      handlebars.partials = {};
    }
  }

, underscore: {
    lib: _
  , extension: 'jst'
  }

};

describe('[functional] doppel', function () {

  _.each(doppel.adapters, function (adapter, name, index) {

    var targets = adapted[name];

    describe('for a source directory of \'' + name + '\' templates', function () {

      before(function () {
        this.options = options[name];

        this.setup = this.options.setup;
        this.teardown = this.options.teardown;
        this.tmp = path.resolve(__dirname, '..', '..', 'tmp');

        this.setup && this.setup();
      });

      after(function (finish) {
        this.teardown && this.teardown();
        rimraf(path.join(this.tmp, name), finish);

        delete this.options;
        delete this.setup;
        delete this.teardown;
        delete this.tmp;
      });

      beforeEach(function () {
        doppel.adapter = doppel.adapters[name](this.options.lib);
      });

      _.each(targets, function (target, type) {

        describe('of type \'' + type + '\'', function () {

          beforeEach(function (ready) {
            this.dest = path.join(this.tmp, name, type);

            mkdirp(this.dest, ready);
          });

          it('creates a compiled copy of the directory', function (done) {
            var self = this;

            doppel(target, this.dest, data, function (err) {
              assertions.assertDirsEqual(expected[type], self.dest, function (err) {
                if (err) throw err;

                done();
              });
            });
          });

        });

      });

    });

  });

});
