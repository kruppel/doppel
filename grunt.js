module.exports = function (grunt) {

  grunt.initConfig({
    lint: {
      all: [
        'grunt.js'
      , 'bin/doppel'
      , 'lib/**/*.js'
      , 'test/**/*.js'
      ]
    }
  , jshint: {
      options: {
        bitwise: true
      , curly: false
      , eqeqeq: true
      , forin: false
      , immed: true
      , latedef: true
      , newcap: true
      , noarg: true
      , noempty: true
      , nonew: true
      , plusplus: false
      , regexp: false
      , undef: false
      , strict: false
      , trailing: true
      , expr: true
      , laxcomma: true
      // es5 enabled to allow use of reserved keywords when used as
      // member names (e.g. `foo.class = 4` but not `var class = 4`)
      , es5: true
    }
  }
  , watch: {
      lint: {
        files: [ '<config:lint.all>' ]
      , tasks: 'lint'
      }
    }
  });

};
