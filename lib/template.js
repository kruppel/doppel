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

    var compiled;

    // Try/catch block to handle errors for:
    //   * compilation
    try {
      compiled = this.engine.compile(read, data);
    }
    catch (e) {
      return callback(e);
    }

    fs.writeFile(this.dest, compiled, function (err) {
      if (err) return callback(err);

      fs.unlink(this.src, callback);
    }.bind(this));
  }.bind(this));
};

// Factory method
Template.forEngine = function (engine, file) {
  return new Template(engine, file);
};

module.exports = Template;
