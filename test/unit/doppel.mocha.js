var path = require('path')
  , util = require('util')
  , _ = require('underscore')
  , sinon = require('sinon')
  , should = require('chai').should()
  , swallow = require('./../shared').swallow
  , glob = require('glob')
  , cpr = require('./../../lib/cpr')
  , engines = require('./../../lib/engines')
  , Template = require('./../../lib/template')
  , InvalidEngineError = require('./../../lib/errors/invalid_engine')
  , doppel = require('./../../lib/doppel');

describe('[unit] doppel', function () {

  afterEach(function () {
    // Default state is no engine set
    delete doppel.engine;
  });

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
              this.rv = doppel.use(name, { extension: alt });

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

            it('returns this for chaining', function () {
              this.rv.should.equal(doppel);
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

            it('returns this for chaining', function () {
              this.rv.should.equal(doppel);
            });

          });

        });

      });

    });

  });

  describe('invocation', function () {

    function wrap() {
      var args = [].slice.call(arguments)
        , context = args.shift()
        , done = args.pop();

      return function () {
        var subargs = [].slice.call(arguments);

        args.forEach(function (arg) {
          arg.apply(context, subargs);
        });

        done();
      };
    }

    beforeEach(function () {
      this.src = path.join(
        __dirname
      , '..'
      , 'fixtures'
      , 'engines'
      , 'underscore'
      , 'base'
      );
      this.dest = path.join(
        __dirname
      , '..'
      , '..'
      , 'tmp'
      , 'base'
      );
      this.data = {
        city: 'azusa'
      , origin: 'a to z, usa, duh, of course'
      };
      this.callback = sinon.stub();
    });

    afterEach(function () {
      delete this.src;
      delete this.dest;
      delete this.callback;
    });

    describe('when engine is not set', function () {

      beforeEach(function () {
        doppel(this.src, this.dest, this.data, this.callback);
      });

      it('calls back with error', function () {
        this.callback.should.have.been.calledWithExactly(
          sinon.match.instanceOf(InvalidEngineError)
        );
      });

      it('calls back with message to set engine with `doppel.use`', function () {
        this.callback.getCall(0).args[0].message.should.match(
          /`doppel.use` must be called with a supported template engine/
        );
      });

      it('calls back with message to use one of the supported engines', function () {
        var engineListMatcher = new RegExp(
          'Supported engines include:\\n  \\* ' +
          Object.keys(engines).join('\\n  \\* ')
        );

        this.callback.getCall(0).args[0].message.should.match(engineListMatcher);
      });

    });

    describe('when engine is set', function () {

      beforeEach(function () {
        doppel.use('underscore');

        sinon.stub(cpr, 'cpr');
      });

      afterEach(function () {
        cpr.cpr.restore();
      });

      describe('when recursive copy fails', function () {

        beforeEach(function () {
          this.cprError = sinon.stub();
          cpr.cpr.withArgs(this.src, this.dest, sinon.match.func)
                 .yields(this.cprError);

          doppel(this.src, this.dest, this.data, this.callback);
        });

        afterEach(function () {
          delete this.cprError;
        });

        it('calls back with error', function () {
          this.callback.should.have.been.calledWithExactly(this.cprError);
        });

      });

      describe('when recursive copy succeeds', function () {

        beforeEach(function () {
          cpr.cpr.withArgs(this.src, this.dest, sinon.match.func).yields();

          sinon.stub(glob, 'Glob');
        });

        afterEach(function () {
          glob.Glob.restore();
        });

        describe('when template search fails', function () {

          beforeEach(function () {
            this.globError = sinon.stub();
            glob.Glob.withArgs(
              util.format('%s/**/*.%s', this.dest, 'jst')
            , sinon.match.func
            ).yields(this.globError);

            doppel(this.src, this.dest, this.data, this.callback);
          });

          afterEach(function () {
            delete this.globError;
          });

          it('calls back with error', function () {
            this.callback.should.have.been.calledWithExactly(this.globError);
          });

        });

        describe('when template search succeeds', function () {

          describe('and directory has no templates', function () {

            beforeEach(function () {
              this.files = [];
              glob.Glob.withArgs(
                util.format('%s/**/*.%s', this.dest, 'jst')
              , sinon.match.func
              ).yields(null, this.files);

              doppel(this.src, this.dest, this.data, this.callback);
            });

            afterEach(function () {
              delete this.files;
            });

            it('calls back without error', function () {
              this.callback.should.have.been.calledWithExactly();
            });

          });

          describe('and directory has a template', function () {

            beforeEach(function () {
              this.files = [ 'deep/down/in/the/template.js.jst' ];
              this.fileSrc = path.join(this.src, this.files[0]);
              this.fileDest = path.join(this.dest, this.files[0]);

              glob.Glob.withArgs(
                util.format('%s/**/*.%s', this.dest, 'jst')
              , sinon.match.func
              ).yields(null, this.files);

              this.template = {
                compile: sinon.stub()
              };
              sinon.stub(Template, 'forEngine').returns(this.template);
            });

            afterEach(function () {
              Template.forEngine.restore();

              delete this.files;
              delete this.fileSrc;
              delete this.fileDest;
              delete this.template;
            });

            describe('and template fails to compile', function () {

              beforeEach(function () {
                this.templateCompileError = sinon.stub();
                this.template.compile.withArgs(this.data, sinon.match.func)
                                     .yields(this.templateCompileError);

                doppel(this.src, this.dest, this.data, this.callback);
              });

              afterEach(function () {
                delete this.templateCompileError;
              });

              it('calls back with error', function () {
                this.callback.should.have.been.calledWithExactly(
                  this.templateCompileError
                );
              });

            });

            describe('and template compiles', function () {

              beforeEach(function () {
                this.template.compile.withArgs(this.data, sinon.match.func)
                                     .yields();

                doppel(this.src, this.dest, this.data, this.callback);
              });

              it('calls back without error', function () {
                this.callback.should.have.been.calledWithExactly(null);
              });

            });

          });

        });

      });

    });

  });

});
