var fs = require('fs')
  , path = require('path')
  , sinon = require('sinon')
  , Template = require('./../../lib/template');

describe('[unit] Template', function () {

  describe('constructor', function () {

    beforeEach(function () {
      this.engine = {
        extension: 'js'
      };
      this.src = __filename;
      this.template = new Template(this.engine, this.src);
    });

    afterEach(function () {
      delete this.engine;
      delete this.src;
      delete this.template;
    });

    it('has an engine', function () {
      this.template.engine.should.equal(this.engine);
    });

    it('has a source location', function () {
      this.template.src.should.equal(this.src);
    });

    it('has a destination location', function () {
      this.template.dest.should.equal(path.join(__dirname, 'template.mocha'));
    });

  });

  describe('.compile', function () {

    beforeEach(function () {
      this.engine = {
        extension: 'compileme'
      , compile: sinon.stub()
      };
      this.src = 'wearehere.compileme';
      this.template = new Template(this.engine, this.src);
      this.dest = this.template.dest;

      this.data = sinon.stub();
      this.callback = sinon.stub();

      sinon.stub(fs, 'readFile');
    });

    afterEach(function () {
      fs.readFile.restore();

      delete this.engine;
      delete this.src;
      delete this.template;
      delete this.dest;
      delete this.callback;
    });

    describe('when source fails to be read', function () {

      beforeEach(function () {
        this.readFileError = sinon.stub();
        fs.readFile.withArgs(this.src, 'utf8', sinon.match.func)
                   .yields(this.readFileError);

        this.template.compile(this.data, this.callback);
      });

      afterEach(function () {
        delete this.readFileError;
      });

      it('calls back with error', function () {
        this.callback.should.have.been.calledWithExactly(this.readFileError);
      });

    });

    describe('when source is read', function () {

      beforeEach(function () {
        this.readData = sinon.stub();
        fs.readFile.withArgs(this.src, 'utf8', sinon.match.func)
                   .yields(null, this.readData);
      });

      afterEach(function () {
        delete this.readData;
      });

      describe('and engine fails to compile template', function () {

        beforeEach(function () {
          this.compileError = sinon.stub();
          this.engine.compile.withArgs(this.readData, this.data)
                             .throws(this.compileError);

          this.template.compile(this.data, this.callback);
        });

        afterEach(function () {
          delete this.compileError;
        });

        it('calls back with error', function () {
          this.callback.should.have.been.calledWithExactly(this.compileError);
        });

      });

      describe('and engine compiles template', function () {

        beforeEach(function () {
          this.compiledTemplate = 'stub template';
          this.engine.compile.withArgs(this.readData, this.data)
                             .returns(this.compiledTemplate);

          sinon.stub(fs, 'writeFile');
        });

        afterEach(function () {
          fs.writeFile.restore();

          delete this.compiledTemplate;
        });

        describe('and destination write errs', function () {

          beforeEach(function () {
            this.writeError = sinon.stub();
            fs.writeFile.withArgs(
              this.dest
            , this.compiledTemplate
            , sinon.match.func
            ).yields(this.writeError);

            this.template.compile(this.data, this.callback);
          });

          afterEach(function () {
            delete this.writeError;
          });

          it('calls back with error', function () {
            this.callback.should.have.been.calledWith(this.writeError);
          });

        });


        describe('and destination write succeeds', function () {

          beforeEach(function () {
            fs.writeFile.withArgs(
              this.dest
            , this.compiledTemplate
            , sinon.match.func
            ).yields();

            sinon.stub(fs, 'unlink');
          });

          afterEach(function () {
            fs.unlink.restore();
          });

          describe('and source file fails to be cleaned up', function () {

            beforeEach(function () {
              this.unlinkError = sinon.stub();
              fs.unlink.withArgs(this.src, this.callback)
                       .yields(this.unlinkError);

              this.template.compile(this.data, this.callback);
            });

            afterEach(function () {
              delete this.unlinkError;
            });

            it('calls back with error', function () {
              this.callback.should.have.been.calledWithExactly(this.unlinkError);
            });

          });

          describe('and source file is cleaned up', function () {

            beforeEach(function () {
              fs.unlink.withArgs(this.src, this.callback).yields();

              this.template.compile(this.data, this.callback);
            });

            it('calls back without error', function () {
              this.callback.should.have.been.calledWithExactly();
            });

          });

        });

      });

    });

  });

  describe('.forEngine', function () {

    beforeEach(function () {
      this.engine = {
        extension: 'test'
      };
      this.src = 'source.test';
      this.dest = 'destinationdir';
    });

    it('returns a Template instance', function () {
      Template.forEngine(this.engine, this.src).should.be.instanceOf(Template);
    });

  });

});
