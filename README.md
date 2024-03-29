doppel -- Copy and compile a directory template
===============================================

## Synopsis

Doppel is a simple Node.js module to copy and compile a directory template.

### Supported template engines

  * [Handlebars](http://handlebarsjs.com)
  * [underscore](http://underscorejs.org)


## Example

From the command line (assumes a global install):

```sh
$ doppel -e handlebars -x hbs -d '{ "itis": { "getting": { "hot": "in
hurrr" } } }' my/source/dir put/compiled/copy/in/here

$ doppel --help
usage: doppel -d context source_dir destination_dir
       doppel -F context_file source_dir destination_dir

Options:
  -d, --data       Sets template data (via JSON string)
  -F, --file       Sets template data (via input file)
  -x, --extension  Sets template file extension
  -e, --engine     Sets template engine [default: "underscore"]
  -V, --version    Prints doppel version
  --help           Displays help information
```

Node.js:

```javascript
// Data to interpolate
var context = {
  itis: {
    getting: {
      hot: 'in hurrr'
    }
  }
};

// **NOTE** An engine must be first set before doppel can be run. A default
// engine is __not__ provided.
doppel.use('underscore');
doppel('my/source/dir', 'put/compiled/copy/in/here', context, function (err) {
  if (err) {
    return console.error('Oh noes, something went wrong!\n%s', err.message);
  }

  console.log('DONEZO');
});
```


## Install

```
npm install doppel
```


## Uninstall

```
npm uninstall doppel
```


## Testing

```
make test
```


## License

Copyright (C) 2013 Pioneers of the Imminently Feasible

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
