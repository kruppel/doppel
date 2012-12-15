var path = require('path')
  , _ = require('underscore')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , should = require('chai').should()
  , cpr = require('./../../lib/cpr')
  , expected = require('./../fixtures').expected
  , assertions = require('./../assertions');

describe('[functional] cpr', function () {

  describe('cpr', function () {

    _.each(expected, function (src, name, index) {

      var tmp = path.resolve(__dirname, '..', '..', 'tmp')
        , dest = path.join(tmp, name);

      describe('for a source directory @ \'' + name + '\'', function () {

        beforeEach(function (ready) {
          mkdirp(dest, ready);
        });

        afterEach(function (finish) {
          rimraf(path.join(tmp, name), finish);
        });

        it('creates a compiled copy of the directory', function (done) {
          cpr.cpr(src, dest, function (err) {
            if (err) throw err;

            assertions.assertDirsEqual(src, dest, function (err) {
              if (err) throw err;

              done();
            });
          });
        });

      });

    });

  });

  describe('cpr.sync', function () {

    _.each(expected, function (src, name, index) {

      var tmp = path.resolve(__dirname, '..', '..', 'tmp')
        , dest = path.join(tmp, name);

      describe('for a source directory @ \'' + name + '\'', function () {

        beforeEach(function (ready) {
          mkdirp(dest, ready);
        });

        afterEach(function (finish) {
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

  });

});
