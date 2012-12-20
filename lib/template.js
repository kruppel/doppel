var fs = require('fs')
  , path = require('path');

/**
 * Template object to compile
 */
function Template(engine, file) {
  this.engine = engine;

  this.src = file;
  this.dest = path.join(
    path.dirname(file)
  , path.basename(file, '.' + this.engine.extension)
  );
}

/**
 * Compiles a template, removing the source file post-compilation and -write
 *
 * @param {object} data interpolation data/context
 * @param {Function} callback
 */
Template.prototype.compile = function (data, callback) {
  fs.readFile(this.src, 'utf8', function (err, read) {
    if (err) return callback(err);

    // Try/catch block to handle errors for:
    //   * creating writable streams
    //   * compilation
    try {
      var compiled = this.engine.compile(read, data)
        , buffer = new Buffer(compiled)
        , writeStream
        , cleanup;

      cleanup = function () {
        fs.unlink(this.src, callback);
      }.bind(this);

      writeStream = fs.createWriteStream(this.dest, { encoding: 'utf8' });
      writeStream.once('error', callback);

      // Once the entire compiled template has been written, remove the
      // source file.
      if (!writeStream.write(buffer)) {
        writeStream.once('drain', cleanup);
      }
      else {
        cleanup();
      }
    }
    catch (e) {
      return callback(e);
    }
  }.bind(this));
};

// Factory method
Template.forEngine = function (engine, file) {
  return new Template(engine, file);
};

module.exports = Template;
