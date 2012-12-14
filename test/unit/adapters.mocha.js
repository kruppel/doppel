var _ = require('underscore')
  , handlebars = require('handlebars');

describe('[unit] adapters', function () {

  var adapters = require('./../../lib/adapters');

  describe('handlebars', function () {

    describe('.extension', function () {

      describe('when passed an extension', function () {

        beforeEach(function () {
          this.extension = 'hbs';
          this.adapter = adapters.handlebars(handlebars, {
            extension: this.extension
          });
        });

        it('sets adapter file extension', function () {
          this.adapter.extension.should.equal(this.extension);
        });

      });

      describe('when not passed an extension', function () {

        beforeEach(function () {
          this.adapter = adapters.handlebars(handlebars);
        });

        it('defaults to \'handlebars\' file extension', function () {
          this.adapter.extension.should.equal('handlebars');
        });

      });

    });

    describe('.compile', function () {

      beforeEach(function () {
        this.adapter = adapters.handlebars(handlebars);
      });

      afterEach(function () {
        delete this.adapter;
      });

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

          this.adapter.compile(template, data).should.equal(
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

          this.adapter.compile(template, data).should.equal(
            '<div id="obonobo"><div id="tacocat"></div></div>'
          );
        });

      });

      it('returns a compiled string', function () {
        var data = { star: 'ter' }
          , template = '!function () { console.log("{{star}}@!"); }()';

        this.adapter.compile(template, data).should.equal(
          '!function () { console.log("ter@!"); }()'
        );
      });

    });

  });

  describe('underscore', function () {

    describe('.extension', function () {

      describe('when passed an extension', function () {

        beforeEach(function () {
          this.extension = 'underscore';
          this.adapter = adapters.underscore(_, {
            extension: this.extension
          });
        });

        it('sets adapter file extension', function () {
          this.adapter.extension.should.equal(this.extension);
        });

      });

      describe('when not passed an extension', function () {

        beforeEach(function () {
          this.adapter = adapters.underscore(_);
        });

        it('defaults to \'jst\' file extension', function () {
          this.adapter.extension.should.equal('jst');
        });

      });

    });

    describe('.compile', function () {

      beforeEach(function () {
        this.adapter = adapters.underscore(_);
      });

      afterEach(function () {
        delete this.adapter;
      });

      it('returns a compiled string', function () {
        var data = { under: { the: '||' } }
          , template = '<div class="bridge">====</div><span><%= under.the %></span>';

        this.adapter.compile(template, data).should.equal(
          '<div class="bridge">====</div><span>||</span>'
        );
      });

    });

  });

});
