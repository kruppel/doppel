doppel -- Copy and compile a directory template
===============================================

## Synopsis

Output like Bizarro Superman, but hotter.

### Supported template libraries

  * [Handlebars](http://handlebarsjs.com)
  * [underscore](http://underscorejs.org)


## Example

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


## License

Copyright (C) 2012 Pioneers of the Imminently Feasible

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
