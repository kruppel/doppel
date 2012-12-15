var _ = require('underscore')
  , sinon = require('sinon')
  , should = require('chai').should()
  , swallow = require('./../shared').swallow
  , engines = require('./../../lib/engines')
  , doppel = require('./../../lib/doppel');

describe('[unit] doppel', function () {

  describe('.use', function () {

    describe('when attempting to set an unsupported engine', function () {

      beforeEach(function () {
        sinon.spy(doppel, 'use');
      });

      afterEach(function () {
        doppel.use.restore();
      });

      it('throws an error', function () {
        swallow(function () { doppel.use('unknownengine'); });

        doppel.use.should.have.thrown();
      });

      it('throws with message that engine is unsupported', function () {
        var e = swallow(function () { doppel.use('unknownengine'); });

        e.message.should.match(/unknownengine template engine is not supported/);
      });

      it('throws with list of supported engines', function () {
        var e = swallow(function () { doppel.use('unknownengine'); })
          , engineListMatcher;

        engineListMatcher = new RegExp(
          'Supported engines include:\\n  \\* ' +
          Object.keys(engines).join('\\n  \\* ')
        );

        e.message.should.match(engineListMatcher);
      });

    });

    describe('when setting to a supported engine', function () {

      var alternateExtensions = {

        handlebars: 'hbs'

      , underscore: 'underscore'

      };

      _.each(engines, function (engine, name) {

        var alt = alternateExtensions[name];

        describe(name, function () {

          describe('and passing an alternate extension, .' + alt, function () {

            beforeEach(function () {
              doppel.use(name, { extension: alt });

              this.actualEngine = doppel.engine;
              this.expectedEngine = engine();
              this.expectedEngine.extension = alt;
            });

            it('sets to ' + name + ' engine', function () {
              this.actualEngine.should.deep.equal(this.expectedEngine);
            });

            it('sets engine extension to .' + alt, function () {
              doppel.engine.extension.should.equal(alt);
            });

          });

          describe('and not passing an extension option', function () {

            beforeEach(function () {
              doppel.use(name);

              this.actualEngine = doppel.engine;
              this.expectedEngine = engine();
            });

            afterEach(function () {
              delete this.actualEngine;
              delete this.expectedEngine;
            });

            it('sets to ' + name + ' engine', function () {
              this.actualEngine.should.deep.equal(this.expectedEngine);
            });

            it('uses default engine extension', function () {
              this.actualEngine.extension.should.equal(this.expectedEngine.extension);
            });

          });

        });

      });

    });

  });

});
