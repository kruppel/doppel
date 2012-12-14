var _ = require('underscore')
  , handlebars = require('handlebars');

describe('[unit] engines', function () {

  var engines = require('./../../lib/engines');

  describe('handlebars', function () {

    beforeEach(function () {
      this.engine = engines.handlebars();
    });

    afterEach(function () {
      delete this.engine;
    });

    it('defaults to \'handlebars\' file extension', function () {
      this.engine.extension.should.equal('handlebars');
    });

    describe('.compile', function () {

      describe('when template uses helper', function () {

        beforeEach(function () {
          handlebars.registerHelper('link', function(text, url) {
            text = handlebars.Utils.escapeExpression(text);
            url  = handlebars.Utils.escapeExpression(url);

            var result = '<a href="' + url + '">' + text + '</a>';

            return new handlebars.SafeString(result);
          });
        });

        afterEach(function () {
          handlebars.helpers = {};
        });

        it('returns a compiled string', function () {
          var template = '<div>{{link title url}}</div>'
            , data = { title: 'home', url: 'http://sherpa.io' };

          this.engine.compile(template, data).should.equal(
            '<div><a href="http://sherpa.io">home</a></div>'
          );
        });

      });

      describe('when template uses a partial', function () {

        beforeEach(function () {
          handlebars.registerPartial('subview', '<div id="{{subid}}"></div>');
        });

        afterEach(function () {
          handlebars.partials = {};
        });

        it('returns a compiled string', function () {
          var data = { superid: 'obonobo', subid: 'tacocat' }
            , template = '<div id="{{superid}}">{{> subview }}</div>';

          this.engine.compile(template, data).should.equal(
            '<div id="obonobo"><div id="tacocat"></div></div>'
          );
        });

      });

      it('returns a compiled string', function () {
        var data = { star: 'ter' }
          , template = '!function () { console.log("{{star}}@!"); }()';

        this.engine.compile(template, data).should.equal(
          '!function () { console.log("ter@!"); }()'
        );
      });

    });

  });

  describe('underscore', function () {

    beforeEach(function () {
      this.engine = engines.underscore();
    });

    it('defaults to \'jst\' file extension', function () {
      this.engine.extension.should.equal('jst');
    });

    describe('.compile', function () {

      beforeEach(function () {
        this.engine = engines.underscore();
      });

      afterEach(function () {
        delete this.engine;
      });

      it('returns a compiled string', function () {
        var data = { under: { the: '||' } }
          , template = '<div class="bridge">====</div><span><%= under.the %></span>';

        this.engine.compile(template, data).should.equal(
          '<div class="bridge">====</div><span>||</span>'
        );
      });

    });

  });

});
