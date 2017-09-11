define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Detail = require("core/Control/Detail");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<div class="complex"></div>';
  var BUTTON_TEMPLATE = "<i></i>";
  var DETAIL_TEMPLATE = "<div class='detail'></div>";

  function Complex() {
    Field.call(this, "core/Control/Field", "Complex");
    this._root = null;
    this._button = null;
    this._detail = null;
  };
  Inherits(Complex, Field);


  function create_collapse(self, selector) {
    var complex = $(selector);
    complex.append(BUTTON_TEMPLATE);
    self._button = $(selector + " > i");
    // caret-right, caret-down
    self._button.addClass("fa");
    self._button.addClass("fa-caret-right");
    self._button.on("click", function (event) {
      if (self._detail == null) {
        // Create
        complex.append(DETAIL_TEMPLATE);
        self._detail = new Detail();
        self._detail.init(selector + " > div.detail", self._class.object_fields)
        .always(function() {
          self._button.removeClass("fa-caret-right");
          self._button.addClass("fa-caret-down");
          self._detail.visible(true);
          self._detail.edit(self._edit);
          self._detail.data(self._data);
        });
        return;
      }
      
      var old_class = self._detail.visible() ? "fa-caret-right" : "fa-caret-down";
      var new_class = self._detail.visible() ? "fa-caret-down" : "fa-caret-right";
      self._button.removeClass(old_class);
      self._button.addClass(new_class);
      self._detail.visible(self._collapse.collapse ? false : true);
    });
  }

  function create_popup(self, selector) {
    var complex = $(selector);
    complex.append(BUTTON_TEMPLATE);
    self._button = $(selector + " > i");
    // caret-right, caret-down
    self._button.addClass("fa");
    self._button.addClass("fa-ellipsis-h");
    self._button.on("click", function (event) {
      var detail = new Detail();
      var dialog = new Dialog();
      dialog.init(function(id) {
        var dfd = new $.Deferred;
        detail.init('#' + id, self._class.object_fields)
        .then(function () {
          detail.data(self._data);
          detail.edit(self._edit);
          detail.refresh();
          detail.visible(true);
          dfd.resolve();
        });
        return dfd.promise();
      }).then(function () {
        dialog.title(Locale.translate(self._class.label));
        dialog.buttons([
          {
            text : "OK",
            click: function (event) {
              self._data = detail.data();
              dialog.close();
              return false;
            }
          },
          {
            text : "Cancel",
            click: function (event) {
              dialog.close();
              return false;
            }
          }
        ]);
        dialog.open();
      });
    });
  }
  
  Complex.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Load template data & Create form tags
    var template = null;
    var self = this;
    Storage.read(Class.CLASS_ID, field.datatype.properties.class_id)
    .done(function (data) { self._class = data; })
    .always(function() {
      root.append(TEMPLATE);

      var this_selector = selector + " > div.complex";
      
      // Collapse
      if (field.datatype.properties.collapse == true) {
        console.log("Collapse");
        create_collapse(self, this_selector);
        dfd.resolve();
        return;
      }
      
      // Popup
      if (field.datatype.properties.mode == true) {
        console.log("Popup");
        create_popup(self, this_selector);
        dfd.resolve();
        return;
      }

      // Embedded
      console.log("Embedded");
      var complex = $(this_selector);
      complex.append(DETAIL_TEMPLATE);
      self._detail = new Detail();
      self._detail.init(this_selector + " > div.detail", self._class.object_fields)
      .always(function() {
        self._detail.visible(true);
        self._detail.edit(false);
        dfd.resolve();
      });
    });
    return dfd.promise();
  };

  Complex.prototype.backup = function() {
    return this._backup;
  };

  Complex.prototype.commit = function() {
    //this._backup = this._detail.data();
    //this._detail.commit();
    this._backup = JSON.parse(JSON.stringify(this._data));
  };

  Complex.prototype.restore = function() {
    //this._detail.data(this._backup);
    //this._detail.restore();
    this._data = JSON.parse(JSON.stringify(this._backup));
  };

  Complex.prototype.edit = function(on) {
    //this._detail.edit(on);
    this._edit = on;
  };

  Complex.prototype.data = function(values) {
    if (arguments.length == 0) {
      //return this._detail.data();
      return this._data;
    } else {
      //this._detail.data(values);
      this._backup = values;
      this._data = values;
    }
  };

  Complex.prototype.refresh = function() {
    //this._detail.refresh();
  };
  
  Complex.renderer = function(field) {
    var dfd = new $.Deferred;
    Storage.read(Class.CLASS_ID, field.datatype.properties.class_id, true)
    .done(function(object) {
      var class_ = new Class(object);
      var renderer = function(record, index, column_index) {
        var captions = class_.captions([record[field.name]]);
        return captions[0];
      };
      dfd.resolve(renderer);
    });
    return dfd.promise();
  };
  
  return Complex;
}); 
