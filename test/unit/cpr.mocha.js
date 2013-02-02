var fs = require('fs')
  , path = require('path')
  , sinon = require('sinon')
  , should = require('chai').should()
  , swallow = require('./../shared').swallow
  , commands = require('./../../lib/commands')
  , cpr = require('./../../lib/cpr');

describe('[unit] cpr', function () {

  beforeEach(function () {
    this.src = path.resolve(__dirname, '..', 'fixtures', 'expected');
    this.dest = path.resolve(__dirname, '..', '..', 'tmp');
  });

  afterEach(function () {
    delete this.src;
    delete this.dest;
  });

  describe('async', function () {

    beforeEach(function () {
      this.fsExistsStub = sinon.stub(fs, 'exists');
    });

    afterEach(function () {
      this.fsExistsStub.restore();

      delete this.fsExistsStub;
    });

    describe('when source directory does not exist', function () {

      beforeEach(function () {
        this.fsExistsStub.withArgs(this.src, sinon.match.func)
                         .yields(false);
      });

      it('calls back with error', function (done) {
        cpr.cpr(this.src, this.dest, function () {
          [].slice.call(arguments)[0].message.should.eql(
            this.src + ' does not exist.'
          );

          done();
        }.bind(this));
      });

    });

    describe('when source directory exists', function () {

      beforeEach(function () {
        this.fsExistsStub.withArgs(this.src, sinon.match.func)
                         .yields(true);
        this.rimrafStub = sinon.stub(commands, 'rm -rf');
      });

      afterEach(function () {
        this.rimrafStub.restore();

        delete this.rimrafStub;
      });

      describe('when destination directory removal fails', function () {

        beforeEach(function () {
          this.rimrafError = sinon.stub();
          this.rimrafStub.withArgs(this.dest, sinon.match.func)
                         .yields(this.rimrafError);
        });

        afterEach(function () {
          delete this.rimrafError;
        });

        it('calls back with error', function (done) {
          cpr.cpr(this.src, this.dest, function () {
            [].slice.call(arguments).should.eql([
              this.rimrafError
            ]);

            done();
          }.bind(this));
        });

      });

      describe('when destination directory removal succeeds', function () {

        beforeEach(function () {
          this.rimrafStub.withArgs(this.dest, sinon.match.func)
                         .yields();

          this.mkdirpStub = sinon.stub(commands, 'mkdir -p');
        });

        afterEach(function () {
          this.mkdirpStub.restore();
        });

        describe('and destination directory creation fails', function (done) {

          beforeEach(function () {
            this.mkdirpError = sinon.stub();
            this.mkdirpStub.withArgs(this.dest, sinon.match.func)
                           .yields(this.mkdirpError);
          });

          afterEach(function () {
            delete this.mkdirpError;
          });

          it('calls back with error', function (done) {
            cpr.cpr(this.src, this.dest, function () {
              [].slice.call(arguments).should.eql([
                this.mkdirpError
              ]);

              done();
            }.bind(this));
          });

        });

        describe('and destination directory creation succeeds', function () {

          beforeEach(function () {
            this.mkdirpStub.withArgs(this.dest, sinon.match.func)
                           .yields(null, this.dest);

            sinon.stub(fs, 'readdir');
          });

          afterEach(function () {
            fs.readdir.restore();
          });

          describe('and reading source directory fails', function () {

            beforeEach(function () {
              this.fsReaddirError = sinon.stub();
              fs.readdir.withArgs(this.src).yields(this.fsReaddirError);
            });

            afterEach(function () {
              delete this.fsReaddirError;
            });

            it('calls back with error', function (done) {
              cpr.cpr(this.src, this.dest, function () {
                [].slice.call(arguments).should.eql([
                  this.fsReaddirError
                ]);

                done();
              }.bind(this));

            });

          });

          describe('and reading source directory succeeds', function () {

            afterEach(function () {
              delete this.files;
            });

            describe('and directory has no files', function () {

              beforeEach(function () {
                this.files = [];

                fs.readdir.withArgs(this.src).yields(null, this.files);
              });

              it('calls back without error', function (done) {
                cpr.cpr(this.src, this.dest, function () {
                  [].slice(arguments).should.eql([]);

                  done();
                });

              });

            });

            describe('and directory has a file', function () {

              beforeEach(function () {
                this.files = [ 'testfile' ];
                this.fileSrc = path.join(this.src, 'testfile');
                this.fileDest = path.join(this.dest, 'testfile');

                fs.readdir.withArgs(this.src).yields(null, this.files);
                sinon.stub(fs, 'stat');
              });

              afterEach(function () {
                fs.stat.restore();
                cpr.restore && (cpr = this._cpr);

                delete this.fileSrc;
                delete this.fileDest;
                delete this._cpr;
              });

              describe('and file stat retrieval fails', function () {

                beforeEach(function () {
                  this.fsStatError = sinon.stub();
                  fs.stat.withArgs(this.fileSrc, sinon.match.func)
                         .yields(this.fsStatError);
                });

                afterEach(function () {
                  delete this.fsStatError;
                });

                it('calls back with error', function (done) {
                  cpr.cpr(this.src, this.dest, function () {
                    [].slice.call(arguments).should.eql([
                      this.fsStatError
                    ]);

                    done();
                  }.bind(this));
                });

              });

              describe('and file stat retrieval succeeds', function () {

                beforeEach(function () {
                  this.fstat = {
                    isDirectory: sinon.stub()
                  };
                  fs.stat.withArgs(this.fileSrc, sinon.match.func)
                         .yields(null, this.fstat);
                });

                afterEach(function () {
                  delete this.fstat;
                });

                describe('and file is not a directory', function () {

                  beforeEach(function () {
                    this.fstat.isDirectory.returns(false);

                    sinon.stub(fs, 'createReadStream');
                    sinon.stub(fs, 'createWriteStream');
                  });

                  afterEach(function () {
                    fs.createReadStream.restore();
                    fs.createWriteStream.restore();
                  });

                  describe('and file copy fails', function () {

                    beforeEach(function () {
                      var self = this
                        , callbacks = {};

                      this.streamingError = sinon.stub();
                      this.readStream = {
                        on: function (event, callback) {
                          callbacks[event] = callback;
                        }
                      , pipe: function (stream) {
                          callbacks.error(self.streamingError);
                        }
                      };
                      fs.createReadStream.withArgs(this.fileSrc, { encoding: 'utf8' })
                                         .returns(this.readStream);
                    });

                    afterEach(function () {
                      delete this.readStream;
                    });

                    it('calls back with error', function (done) {
                      cpr.cpr(this.src, this.dest, function () {
                        [].slice.call(arguments).should.eql([
                          this.streamingError
                        ]);

                        done();
                      }.bind(this));
                    });

                  });

                  describe('and file copy succeeds', function () {

                    beforeEach(function () {
                      var callbacks = {};

                      this.readStream = {
                        on: function (event, callback) {
                          callbacks[event] = callback;
                        }
                      , pipe: function (stream) {
                          callbacks.end();
                        }
                      };
                      fs.createReadStream.withArgs(this.fileSrc, { encoding: 'utf8' })
                                         .returns(this.readStream);
                    });

                    afterEach(function () {
                      delete this.readStream;
                    });

                    it('calls back without error', function (done) {
                      cpr.cpr(this.src, this.dest, function () {
                        [].slice.call(arguments).should.eql([ null ]);

                        done();
                      }.bind(this));
                    });

                  });

                });

                describe('and file is a directory', function () {

                  beforeEach(function () {
                    var resolve = path.resolve;

                    this.fstat.isDirectory.returns(true);

                    // Duck punch `path.resolve`, since the 'testfile' does
                    // not exist and will fail to resolve.
                    sinon.stub(path, 'resolve', function (path1, path2) {
                      if (path2 === this.fileDest || path2 === this.fileSrc) {
                        return path2;
                      }

                      return resolve(path1, path2);
                    }.bind(this));

                    this.fsExistsStub.withArgs(this.fileSrc, sinon.match.func)
                                     .yields(true);
                  });

                  afterEach(function () {
                    path.resolve.restore();
                  });

                  describe('and directory copy fails', function () {

                    beforeEach(function () {
                      this.rimrafError = sinon.stub();
                      this.rimrafStub.withArgs(this.fileDest, sinon.match.func)
                                     .yields(this.rimrafError);
                    });

                    afterEach(function () {
                      delete this.rimrafError;
                    });

                    it('calls back with error', function (done) {
                      cpr.cpr(this.src, this.dest, function () {
                        [].slice.call(arguments).should.eql([ this.rimrafError ]);

                        done();
                      }.bind(this));
                    });

                  });

                  describe('and directory copy succeeds', function () {

                    beforeEach(function () {
                      this.rimrafStub.withArgs(this.fileDest, sinon.match.func)
                                     .yields();
                      this.mkdirpStub.withArgs(this.fileDest, sinon.match.func)
                                     .yields(null, this.fileDest);

                      fs.readdir.withArgs(this.fileSrc, sinon.match.func)
                                .yields(null, []);
                    });

                    it('calls back without error', function (done) {
                      cpr.cpr(this.src, this.dest, function () {
                        [].slice.call(arguments).should.eql([ null ]);

                        done();
                      }.bind(this));
                    });

                  });

                });

              });

            });

          });

        });

      });

    });

  });

  describe('sync', function () {

    var rimraf = commands['rm -rf'];

    beforeEach(function () {
      sinon.spy(cpr, 'sync');
    });

    afterEach(function () {
      cpr.sync.restore();
    });

    describe('when destination directory removal fails', function () {

      beforeEach(function () {
        this.rimrafError = sinon.stub();
        sinon.stub(rimraf, 'sync').throws(this.rimrafError);
      });

      afterEach(function () {
        rimraf.sync.restore();

        delete this.rimrafError;
      });

      it('throws an error', function () {
        swallow(function () { cpr.sync(this.src, this.dest); }.bind(this));

        cpr.sync.should.have.thrown(this.rimrafError);
      });

    });

    describe('when destination directory removal succeeds', function () {

      var mkdirp = commands['mkdir -p'];

      beforeEach(function () {
        sinon.stub(rimraf, 'sync').returns();
      });

      afterEach(function () {
        rimraf.sync.restore();
      });

      describe('and destination directory creation fails', function () {

        beforeEach(function () {
          this.mkdirpError = new Error('mkdirp fail fail fail');
          sinon.stub(mkdirp, 'sync').throws(this.mkdirpError);
        });

        afterEach(function () {
          mkdirp.sync.restore();

          delete this.mkdirpError;
        });

        it('throws an error', function () {
          swallow(function () { cpr.sync(this.src, this.dest); }.bind(this));

          cpr.sync.should.have.thrown(this.mkdirpError);
        });

      });

      describe('and destination directory creation succeeds', function () {

        beforeEach(function () {
          sinon.stub(mkdirp, 'sync').returns();
        });

        afterEach(function () {
          mkdirp.sync.restore();
        });

        describe('and reading source directory fails', function () {

          beforeEach(function () {
            this.fsReaddirError = new Error('fs.readdir fail fail fail');
            sinon.stub(fs, 'readdirSync').throws(this.fsReaddirError);
          });

          afterEach(function () {
            fs.readdirSync.restore();

            delete this.fsReaddirError;
          });

          it('throws an error', function () {
            swallow(function () { cpr.sync(this.src, this.dest); }.bind(this));

            cpr.sync.should.have.thrown(this.fsReaddirError);
          });

        });

        describe('and reading source directory succeeds', function () {

          describe('and directory has no files', function () {

            beforeEach(function () {
              this.files = [];
              sinon.stub(fs, 'readdirSync').returns(this.files);
            });

            afterEach(function () {
              fs.readdirSync.restore();

              delete this.files;
            });

            it('returns undefined', function () {
              cpr.sync(this.src, this.dest);

              should.not.exist(cpr.cpr(this.src, this.dest));
            });

          });

          describe('and directory has a file', function () {

            beforeEach(function () {
              this.files = [ 'testfile' ];
              this.fileSrc = path.join(this.src, 'testfile');
              this.fileDest = path.join(this.dest, 'testfile');

              sinon.stub(fs, 'readdirSync').returns(this.files);

              this.fstat = { isDirectory: sinon.stub() };
              sinon.stub(fs, 'statSync')
                   .withArgs(this.fileSrc)
                   .returns(this.fstat);
            });

            afterEach(function () {
              fs.readdirSync.restore();
              fs.statSync.restore();

              delete this.files;
              delete this.fileSrc;
              delete this.fileDest;
              delete this.fstat;
            });

            describe('and file is not a directory', function () {

              beforeEach(function () {
                this.fstat.isDirectory.returns(false);

                sinon.stub(fs, 'readFileSync');
                sinon.stub(fs, 'writeFileSync');
              });

              afterEach(function () {
                fs.readFileSync.restore();
                fs.writeFileSync.restore();
              });

              describe('and file copy fails', function () {

                beforeEach(function () {
                  this.cpError = new Error('cp read fail fail fail');
                });

                afterEach(function () {
                  delete this.cpError;
                });

                describe('due to failed file read', function () {

                  beforeEach(function () {
                    fs.readFileSync.withArgs(this.fileSrc, 'utf8')
                                   .throws(this.cpError);
                  });

                  it('throws an error', function () {
                    swallow(function () {
                      cpr.sync(this.src, this.dest);
                    }.bind(this));

                    cpr.sync.should.have.thrown(this.cpError);
                  });

                });

                describe('due to failed file write', function () {

                  beforeEach(function () {
                    this.readString = sinon.stub();
                    fs.readFileSync.withArgs(this.fileSrc, 'utf8')
                                   .returns(this.readString);

                    fs.writeFileSync.withArgs(this.fileDest, this.readString, 'utf8')
                                    .throws(this.cpError);
                  });

                  afterEach(function () {
                    delete this.readString;
                  });

                  it('throws an error', function () {
                    swallow(function () {
                      cpr.sync(this.src, this.dest);
                    }.bind(this));

                    cpr.sync.should.have.thrown(this.cpError);
                  });

                });

              });

              describe('and file copy succeeds', function () {

                beforeEach(function () {
                  fs.readFileSync.withArgs(this.fileSrc, 'utf8')
                                 .returns(this.readString);
                  fs.writeFileSync.withArgs(this.fileDest, this.readString, 'utf8')
                                  .returns();
                });

                it('returns undefined', function () {
                  should.not.exist(cpr.sync(this.src, this.dest));
                });

              });

            });

            describe('and file is a directory', function () {

              beforeEach(function () {
                this.fstat.isDirectory.returns(true);

                this._cpr = cpr.sync;
                cpr.sync.restore();
                sinon.stub(cpr, 'sync');
              });

              afterEach(function () {
                delete this._cpr;
              });

              describe('and directory copy fails', function () {

                beforeEach(function () {
                  this.cprError = new Error('cpr fail fail fail');
                  cpr.sync.withArgs(this.fileSrc, this.fileDest)
                          .throws(this.cprError);
                });

                afterEach(function () {
                  delete this.cprError;
                });

                it('throws an error', function () {
                  swallow(function () {
                    this._cpr(this.src, this.dest);
                  }.bind(this));

                  this._cpr.should.have.thrown(this.cprError);
                });

              });

              describe('and directory copy succeeds', function () {

                beforeEach(function () {
                  cpr.sync.withArgs(this.fileSrc, this.fileDest)
                          .returns();
                });

                it('recursively copies file directory', function () {
                  should.not.exist(this._cpr(this.src, this.dest));
                });

              });

            });

          });

        });

      });

    });

  });

});
