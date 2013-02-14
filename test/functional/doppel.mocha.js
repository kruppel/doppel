var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , _ = require('underscore')
  , handlebars = require('handlebars')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , should = require('chai').should()
  , doppel = require('./../../lib/doppel')
  , engines = require('./../../lib/engines')
  , fixtures = require('./../fixtures')
  , expected = fixtures.expected
  , engineered = fixtures.actual.engines
  , assertions = require('./../assertions')
  , options
  , data;

data = {
  test_string: 'testing123'
, list: [ 19, 84, 'Carl Lewis' ]
};

options = {

  handlebars: {
    setup: function () {
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

, underscore: {}

};

describe('[functional] doppel', function () {

  describe('when an engine is not set', function () {

    beforeEach(function () {
      this.root = path.resolve(__dirname, '..', '..');
      this.modified = fs.lstatSync(this.root).mtime;
    });

    afterEach(function () {
      delete this.root;
      delete this.modified;
    });

    it('calls back with error', function (done) {
      doppel(undefined, undefined, data, function (err) {
        err.message.should.match(
          /`doppel.use` must be called with a supported template engine/
        );

        done();
      });
    });

    it('does not make any file changes', function (done) {
      doppel(undefined, undefined, data, function (err) {
        fs.lstat(this.root, function (err, stats) {
          stats.mtime.should.eql(this.modified);

          done();
        }.bind(this));
      }.bind(this));
    });

  });

  describe('when not passed', function () {

    beforeEach(function () {
      this.root = path.resolve(__dirname, '..', '..');
      this.modified = fs.lstatSync(this.root).mtime;

      doppel.use('underscore');
    });

    afterEach(function () {
      delete this.root;
      delete this.modified;
    });

    describe('a source directory', function () {

      beforeEach(function () {
        this.dest = path.join(this.root, 'tmp');
      });

      afterEach(function () {
        delete this.dest;
      });

      it('calls back with an invalid source error', function (done) {
        doppel(undefined, this.dest, data, function (err) {
          err.message.should.equal('Source path must be provided.');

          done();
        });
      });

      it('does not make any file changes', function (done) {
        doppel(undefined, this.dest, data, function (err) {
          fs.lstat(this.root, function (err, stats) {
            stats.mtime.should.eql(this.modified);

            done();
          }.bind(this));
        }.bind(this));
      });

    });

    describe('a nonexistent source directory', function () {

      beforeEach(function () {
        this.src = 'this/path/should/never/ever/exist/please';
        this.dest = path.join(this.root, 'tmp');
      });

      afterEach(function () {
        delete this.src;
        delete this.dest;
      });

      it('calls back with an invalid source error', function (done) {
        doppel(this.src, this.dest, data, function (err) {
          err.message.should.match(
            new RegExp(
              util.format(
                'Source path .*%s does not exist.'
              , this.src
              )
            )
          );

          done();
        }.bind(this));
      });

      it('does not make any file changes', function (done) {
        doppel(this.src, this.dest, data, function (err) {
          fs.lstat(this.root, function (err, stats) {
            stats.mtime.should.eql(this.modified);

            done();
          }.bind(this));
        }.bind(this));
      });

    });

    describe('a destination directory', function () {

      it('calls back with an invalid destination error', function (done) {
        doppel(expected.base, undefined, data, function (err) {
          err.message.should.equal('Destination path must be provided.');

          done();
        });
      });

      it('does not make any file changes', function (done) {
        doppel(expected.base, undefined, data, function (err) {
          fs.lstat(this.root, function (err, stats) {
            stats.mtime.should.eql(this.modified);

            done();
          }.bind(this));
        }.bind(this));
      });

    });

  });

  describe('for a source directory', function () {

    before(function (ready) {
      this.tmp = path.resolve(__dirname, '..', '..', 'tmp');

      mkdirp(this.tmp, ready);
    });

    after(function () {
      delete this.tmp;
    });

    _.each(engines, function (engine, name, index) {

      var targets = engineered[name];

      describe('of \'' + name + '\' templates', function () {

        before(function () {
          this.options = options[name];

          this.setup = this.options.setup;
          this.teardown = this.options.teardown;

          this.setup && this.setup();
        });

        after(function () {
          this.teardown && this.teardown();

          delete this.options;
          delete this.setup;
          delete this.teardown;
        });

        beforeEach(function () {
          doppel.use(name);
        });

        _.each(targets, function (target, type) {

          describe('of type \'' + type + '\'', function () {

            var dest = path.join(this.tmp, name, type);

            beforeEach(function () {
              this.ok = true;
            });

            afterEach(function (finish) {
              if (!this.ok) this.test.error(new Error('failed to copy cwd'));

              delete this.ok;

              rimraf(dest, finish);
            });

            it('creates a compiled copy of the directory', function (done) {
              var self = this;

              doppel(target, dest, data, function (err) {
                if (err) {
                  self.ok = false;

                  return;
                }

                assertions.assertDirsEqual(expected[type], dest, function (err) {
                  if (err) {
                    self.ok = false;

                    return;
                  }

                  done();
                });
              });
            });

          });

        });

      });

    });

  });

});
