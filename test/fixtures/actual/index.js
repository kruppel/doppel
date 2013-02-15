var path = require('path');

module.exports = {

  cwd_as_src: path.join(__dirname, 'cwd_as_src')
, src_in_dest: path.join(__dirname, 'src_in_dest')

, engines: require('./engines')

};
