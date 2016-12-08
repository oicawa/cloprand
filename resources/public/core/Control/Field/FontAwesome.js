define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Dialog = require("core/Dialog");
  var Grid = require("core/Control/Grid");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div></div>';
  var FONT_TEMPLATE = '' +
'<span style="display:table;border:1px solid gray;border-radius:5px;margin:2px;height:60px;width:60px;">' +
'  <i style="display:table-cell;text-align:center;vertical-align:middle;padding:5px;" class="fa {{FONTAWESOME_CLASSNAME}} fa-3x fa-fw"></i>' +
'</span>';
  var WEBFONT_ID = '43a28dff-bc30-452e-b748-08235443b7ce';
  var FONTAWESOME_ID = '9c103467-759b-424a-9544-7bdd81030141';

  function create_control(self, root, field) {
    root.empty();
    root.append(TEMPLATE);
    
    var label = root.find("label");
    label.text(field.label);
    
    var div = root.find("div");
    var font = FONT_TEMPLATE.replace(/{{FONTAWESOME_CLASSNAME}}/, "");
    div.append(font);
    
    self._icon = div.find("i");
  }
  
  function FontAwesome() {
    Field.call(this, "core/Control/Field", "FontAwesome");
    this._fonts = null;
    this._icon = null;
    this._value = null;
    this._fixed = null;
  }
  Inherits(FontAwesome, Field);

  FontAwesome.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Create control
    var self = this;
    Storage.read(WEBFONT_ID, FONTAWESOME_ID)
    .done(function(data) {
      self._fonts = data.fonts;
      create_control(self, root, field);
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  FontAwesome.prototype.edit = function(on) {
    if (!this._icon) {
      return;
    }
    if (!on) {
      this._icon.off("click");
      return;
    };
    
    var self = this;
    
    this._icon.on("click", function(event) {
      console.log("Show FontAwesome font select dialog.");
      var dialog = new Dialog();
      var grid = new Grid();
      var select_panel = "";
      dialog.init(function(panel_id) {
        var dfd = new $.Deferred;
        var panel = $("#" + panel_id);
        panel.append("<div name='grid'></div>");
        var selector = "#" + panel_id +" > div[name='grid']";
        grid.init(selector, [
          { field   : 'recid',
            caption : 'No.',
            size    : '30px'},
          { field   : 'id',
            caption : 'Icon',
            size    : '70px',
            render  : function(record, index, column_index) {
              var html = FONT_TEMPLATE.replace(/{{FONTAWESOME_CLASSNAME}}/, record.id);
              return html;
            }},
          { field   : 'name',
            caption : 'Name',
            size    : '200px'}
        ],
        'height:500px;')
        .then(function() {
          grid.multi_search(true);
          grid.toolbar(true);
          grid.data(self._fonts);
          grid.refresh();
          dfd.resolve();
        });
        return dfd.promise();
      });
      dialog.title("Select Icon");
      dialog.buttons([
        {
          text : "OK",
          click: function (event) {
            var recid = grid.selection();
            console.log("[OK] clicked. selection=" + recid);
            self._value = self._fonts[recid].id;
            self.refresh();
            dialog.close();
          }
        },
        {
          text : "Cancel",
          click: function (event) {
            console.log("[Cancel] clicked.");
            dialog.close();
          }
        }
      ]);
      dialog.size(500, 600);
      
      dialog.open();
    });
  };

  FontAwesome.prototype.backuped = function() {
    return this._fixed;
  };

  FontAwesome.prototype.commit = function() {
    this._fixed = this._value;
  };

  FontAwesome.prototype.restore = function() {
    this._value = this._fixed;
    this.refresh();
  };

  FontAwesome.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._value;
    } else {
      this._value = value;
      this._fixed = value;
      this.refresh();
    }
  };
  
  FontAwesome.prototype.update = function(keys) {
  
  }
  
  FontAwesome.prototype.refresh = function() {
    this._icon.attr("class", "");
    this._icon.addClass("fa");
    this._icon.addClass(this._value);
    this._icon.addClass("fa-3x");
    this._icon.addClass("fa-fw");
  }

  return FontAwesome;
}); 
