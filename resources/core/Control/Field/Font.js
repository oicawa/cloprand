define(function (require) {
  require("jquery");
  var Locale = require("core/Locale");
  var Connector = require("core/Connector");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Finder = require("core/Control/Finder");
  
  var TEMPLATE = '<div><div name="font-name"></div></div>';
  var FONT_TEMPLATE = '<span style="height:50px;font-size:24pt;font-family:\'{{FONT_NAME}}\';">{{SAMPLE_TEXT}}</span>';

  function Font() {
    Field.call(this, "core/Control/Field", "Font");
    this._selector = null;
    this._finder = null;
    this._fonts = null;
  }
  Inherits(Font, Field);

  Font.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;

    this._selector = selector;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    root.empty();
    root.append(TEMPLATE);

    // Finders
    this._finder = new Finder();
    
    var properties = field.datatype.properties;
    var min_width = !properties ? null : properties.min_width;

    var self = this;
    
    function render0(record, index, column_index) {
      return index + 1;
    };
    
    function render1(record, index, column_index) {
      return record.name;
    };
    
    function render2(record, index, column_index) {
      var html = FONT_TEMPLATE;
      html = html.replace(/{{FONT_NAME}}/, record.name);
      html = html.replace(/{{SAMPLE_TEXT}}/, Locale.translate(properties.sample_text));
      return html;
    };
    var columns = [
      { "field" : 'recid',   "caption" : 'No.',       "size" : '50px'},
      { "field" : 'name',    "caption" : 'Font Name', "size" : '200px'},
      { "field" : 'display', "caption" : 'Display',   "size" : '400px', "render" : render2}
    ];
    
    
    //Connector.operate('fonts', 'get-family-names', 'json', null)
    Connector.operate('fonts', 'get-list', 'json', null)
    .then(function(font_names) {
      self._fonts = font_names.sort().map(function (font_name, index) { return { "id" : index, "name" : font_name}; });
      //console.log(self._fonts);
    })
    .then(function () {
      function converter(fonts) {
        return fonts.map(function (font) { return font.name; });
        //return fonts;
      }
      return self._finder.init(selector + " > div > div[name='font-name']",
        columns, null, self._fonts, properties.title, true, 200, converter, null, 50);
    })
    .then(function () {
      self._finder.ok(function (recids) {
        var recid = recids[0];
        self._finder._value = recid;
        //console.log(self._finder._value);
        self.refresh();
      });
    })
    .then(function () {
      dfd.resolve();
    });
    return dfd.promise();
  };

  Font.prototype.edit = function(on) {
    if (arguments.length == 0) {
      return this._finder._editting;
    }
    this._finder.edit(on);
  };
  
  Font.prototype.backup = function() {
    var font = this._finder.backup();
    return font;
  };

  Font.prototype.commit = function() {
    this._finder.commit();
    var index = this._finder._value;
    this._font_name = this._fonts[index].name;
  };

  Font.prototype.restore = function() {
    this._finder.restore();
  };

  Font.prototype.data = function(value) {
    if (arguments.length == 0) {
      var index = this._finder._value;
      if (index === null) {
        return null;
      }
      var font = this._fonts[index];
      return font.name;
    }

    this._font_name = value;
    var fonts = this._fonts.filter(function (font) { return font.name === value; });
    this._finder._value = fonts.length == 0 ? null : fonts[0].id;
    this.refresh();
  };
  
  Font.prototype.update = function(keys) {
  };

  Font.prototype.refresh = function() {
    this._finder.refresh();
  };

  Font.renderer = function(field) {
    var dfd = new $.Deferred;
    var renderer = function(record, index, column_index) {
      //console.log(record);
      return record.name;
    };
    dfd.resolve(renderer);
    return dfd.promise();
  };

  return Font;
});
