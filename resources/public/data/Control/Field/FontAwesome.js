define(function (require) { 
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Connector = require("data/Core/Connector");
  var Inherits = require("data/Core/Inherits");
  var Dialog = require("data/Core/Dialog");
  var Grid = require("data/Control/Grid");
  var Field = require("data/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div><i style="display:block;height:50px;width:50px;border: 1px solid gray;border-radius: 5px;font-size: 36px;padding: 5px;"></i></div>';

  var OPTION_TEMPLATE = '<i></i>';

  function create_control(self, root, field) {
    root.empty();
    root.append(TEMPLATE);
    
    var label = root.find("label");
    label.text(field.label);
    
    self._icon = root.find("i");
  }
  
  function FontAwesome() {
    Field.call(this, "data/Control/Field", "FontAwesome");
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
    Connector.crud.read("api/WebFonts/FontAwesome", "json", function(data) { self._fonts = data.fonts; })
    .then(function() {
      create_control(self, root, field);
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  //var FONT_TEMPLATE = '<i></i>';
  var FONT_TEMPLATE = '' +
'<span style="display:table;width:50px;height:50px;border:1px solid gray;border-radius:5px;margin:2px;">' +
'  <i style="display:table-cell;text-align:center;vertical-align:middle;" class="fa {{FONTAWESOME_CLASSNAME}} fa-3x fw"></i>' +
'</span>';

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
      dialog.init(function(panel) {
        panel.append("<div name='grid'></div>");
        var selector = "#" + panel.attr("id") +" > div[name='grid']";
        grid.init(selector, [
          { field   : 'id',
            caption : 'Icon',
            size    : '60px',
            render  : function(record, index, column_index) {
              var html = FONT_TEMPLATE.replace(/{{FONTAWESOME_CLASSNAME}}/, record.id);
              return html;
            }},
          { field   : 'name',
            caption : 'Name',
            size    : '200px'}
        ],
        'height:200px;')
        .then(function() {;
          grid.data(self._fonts);
          grid.refresh();
        });
      });
      dialog.title("Select Icon");
      dialog.bind({
        id      : "OK",
        caption : "OK",
        proc    : function (event) {
          var recid = grid.selection();
          console.log("[OK] clicked. selection=" + recid);
          self._value = self._fonts[recid].id;
          self.refresh();
          dialog.close();
        }
      });
      dialog.bind({
        id      : "Cancel",
        caption : "Cancel",
        proc    : function (event) {
          console.log("[Cancel] clicked.");
          dialog.close();
        }
      });
      dialog.show();
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
    this._icon.addClass("fw");
  }

  return FontAwesome;
}); 
