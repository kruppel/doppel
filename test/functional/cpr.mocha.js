var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , _ = require('underscore')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , should = require('chai').should()
  , cpr = require('./../../lib/cpr')
  , fixtures = require('./../fixtures')
  , expected = fixtures.expected
  , assertions = require('./../assertions');

describe('[functional] cpr', function () {

  describe('cpr', function () {

    describe('when not passed', function () {

      beforeEach(function () {
        this.root = path.resolve(__dirname, '..', '..');
        this.modified = fs.lstatSync(this.root).mtime;
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
          cpr.cpr(undefined, this.dest, function (err) {
            err.message.should.equal('Source path must be provided.');

            done();
          });
        });

        it('does not make any file changes', function (done) {
          cpr.cpr(undefined, this.dest, function (err) {
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
          cpr.cpr(this.src, this.dest, function (err) {
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
          cpr.cpr(this.src, this.dest, function (err) {
            fs.lstat(this.root, function (err, stats) {
              stats.mtime.should.eql(this.modified);

              done();
            }.bind(this));
          }.bind(this));
        });

      });

      describe('a destination directory', function () {

        it('calls back with an invalid destination error', function (done) {
          cpr.cpr(expected.base, undefined, function (err) {
            err.message.should.equal('Destination path must be provided.');

            done();
          });
        });

        it('does not make any file changes', function (done) {
          cpr.cpr(expected.base, undefined, function (err) {
            fs.lstat(this.root, function (err, stats) {
              stats.mtime.should.eql(this.modified);

              done();
            }.bind(this));
          }.bind(this));
        });

      });

    });

    describe('for a source directory', function () {

      var tmp = path.resolve(__dirname, '..', '..', 'tmp');

      before(function (ready) {
        mkdirp(tmp, ready);
      });

      _.each(expected, function (src, name, index) {

        var dest = path.join(tmp, name);

        describe('@ \'' + name + '\'', function () {

          beforeEach(function () {
            this.ok = true;
          });

          afterEach(function (finish) {
            if (!this.ok) {
              this.test.error(
                new Error(util.format('failed to copy %s', name))
              );
            }

            delete this.ok;

            rimraf(dest, finish);
          });

          it('creates a copy of the directory', function (done) {
            var self = this;

            cpr.cpr(src, dest, function (err) {
              if (err) {
                self.ok = false;

                return;
              }

              assertions.assertDirsEqual(src, dest, function (err) {
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

      describe('@ current working directory', function () {

        var name = 'cwd_as_src'
          , dest = path.join(tmp, name)
          , original = dest + '_original';

        beforeEach(function (ready) {
          this.cwd = process.cwd();
          this.ok = true;

          cpr.cpr(fixtures.actual[name], original, function (err) {
            process.chdir(tmp);

            mkdirp(dest, ready);
          });
        });

        afterEach(function (finish) {
          process.chdir(this.cwd);

          if (!this.ok) this.test.error(new Error('failed to copy cwd'));

          delete this.cwd;
          delete this.ok;

          rimraf(path.join(tmp, name), finish);
        });

        it('creates a copy of cwd', function (done) {
          var self = this
            , src = process.cwd();

          cpr.cpr(src, dest, function (err) {
            if (err) {
              self.ok = false;

              return;
            }

            assertions.assertDirsEqual(
              original
            , path.join(dest, name + '_original')
            , function (err) {
                if (err) {
                  self.ok = false;

                  return;
                }

                done();
              }
            );
          });
        });

      });

    });

  });

  describe('cpr.sync', function () {

    var tmp = path.resolve(__dirname, '..', '..', 'tmp');

    describe('for a source directory', function () {

      _.each(expected, function (src, name, index) {

        var dest = path.join(tmp, name);

        describe('@ \'' + name + '\'', function () {

          beforeEach(function (ready) {
            this.ok = true;

            mkdirp(dest, ready);
          });

          afterEach(function (finish) {
            if (!this.ok) {
              this.test.error(
                new Error(util.format('failed to copy %s', name))
              );
            }

            delete this.ok;

            rimraf(path.join(tmp, name), finish);
          });

          it('creates a compiled copy of the directory', function (done) {
            cpr.sync(src, dest);

            assertions.assertDirsEqual(src, dest, function (err) {
              if (err) throw err;

              done();
            });
          });

        });

      });

      describe('@ current working directory', function () {

        var name = 'cwd_as_src'
          , dest = path.join(tmp, name)
          , original = dest + '_original';

        beforeEach(function (ready) {
          this.cwd = process.cwd();
          this.ok = true;

          cpr.cpr(fixtures.actual[name], original, function (err) {
            process.chdir(tmp);

            mkdirp(dest, ready);
          });
        });

        afterEach(function (finish) {
          process.chdir(this.cwd);

          if (!this.ok) this.test.error(new Error('failed to copy cwd'));

          delete this.cwd;
          delete this.ok;

          rimraf(path.join(tmp, name), finish);
        });

        it('creates a copy of cwd', function (done) {
          var self = this
            , src = process.cwd();

          cpr.sync(src, dest);

          assertions.assertDirsEqual(
            original
          , path.join(dest, name + '_original')
          , function (err) {
              if (err) {
                self.ok = false;

                return;
              }

              done();
            }
          );
        });

      });

    });

  });

});
