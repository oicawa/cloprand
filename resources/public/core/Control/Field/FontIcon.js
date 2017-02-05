define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Storage = require("core/Storage");
  var Class = require("core/Class");
  var Inherits = require("core/Inherits");
  var Dialog = require("core/Dialog");
  var Grid = require("core/Control/Grid");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div></div>';
  var FONT_TEMPLATE = '' +
'<span style="display:table;border:1px solid gray;border-radius:5px;margin:2px;height:60px;width:60px;">' +
'  <i style="display:table-cell;text-align:center;vertical-align:middle;padding:5px;" class="fa {{FONT_NAME}} fa-3x fa-fw"></i>' +
'</span>';

  function create_control(self, root, field) {
    root.empty();
    root.append(TEMPLATE);
    
    var label = root.find("label");
    var caption = Locale.translate(field.label);
    label.text(caption);
    
    var div = root.find("div");
    var font = FONT_TEMPLATE.replace(/{{FONT_NAME}}/, "");
    div.append(font);
    
    self._icon = div.find("i");
    // Mouse over/out on icons.
    self._icon.on("mouseover", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "pointer");
    });
    self._icon.on("mouseout", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "auto");
    });
  }
  
  function FontIcon() {
    Field.call(this, "core/Control/Field", "FontIcon");
    this._fonts = null;
    this._icon = null;
    this._value = null;
    this._fixed = null;
  }
  Inherits(FontIcon, Field);

  FontIcon.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Properties
    var prop = Utils.get_as_json(
      { font_icons_id : ["9c103467-759b-424a-9544-7bdd81030141"] },
      function () { return field.datatype.properties; }
    );
    var webfonts_id = prop.font_icons_id[0];

    // Create control
    var self = this;
    Storage.read(Class.WEBFONTS_SETS_ID, webfonts_id)
    .done(function(data) {
      self._fonts = {};
      data.fonts.forEach(function(font) {
      	delete font.recid;
      	self._fonts[font.id] = font;
      });
      create_control(self, root, field);
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  FontIcon.prototype.edit = function(on) {
    if (!this._icon) {
      return;
    }
    if (!on) {
      this._icon.off("click");
      return;
    };
    
    var self = this;
    
    this._icon.on("click", function(event) {
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
              var html = FONT_TEMPLATE.replace(/{{FONT_NAME}}/, record.id);
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
          grid.row_height(70);
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

  FontIcon.prototype.backuped = function() {
    return this._fixed;
  };

  FontIcon.prototype.commit = function() {
    this._fixed = this._value;
  };

  FontIcon.prototype.restore = function() {
    this._value = this._fixed;
    this.refresh();
  };

  FontIcon.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._value;
    } else {
      this._value = value;
      this._fixed = value;
      this.refresh();
    }
  };
  
  FontIcon.prototype.update = function(keys) {
  
  }
  
  FontIcon.prototype.refresh = function() {
    this._icon.attr("class", "");
    this._icon.addClass("fa");
    this._icon.addClass(this._value);
    this._icon.addClass("fa-3x");
    this._icon.addClass("fa-fw");
  }
  
  FontIcon.cell_render = function(field) {
    var dfd = new $.Deferred;
    var renderer = function(record, index, column_index) {
      var value = record[field.name];
      return '<i style="display:table-cell;text-align:center;vertical-align:middle;padding:5px;" class="fa ' + value + ' fa-fw"></i>';
    };
    dfd.resolve(renderer);
    return dfd.promise();
  };

  return FontIcon;
}); 
