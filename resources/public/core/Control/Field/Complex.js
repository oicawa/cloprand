define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Detail = require("core/Control/Detail");
  var Field = require("core/Control/Field/Field");
  var Dialog = require("core/Dialog");
  var DivButton = require("core/Control/DivButton");
  
  var TEMPLATE = '<div class="complex"></div>';
  var BUTTON_TEMPLATE = "<div name='button'></div>";
  var DETAIL_TEMPLATE = "<div class='detail'></div>";

  function Complex() {
    Field.call(this, "core/Control/Field", "Complex");
    this._root = null;
    this._button = null;
    this._detail = null;
  };
  Inherits(Complex, Field);


  Complex.create_as_folded = function(self, selector) {
    var complex = $(selector);
    complex.append(BUTTON_TEMPLATE);
    self._button = new DivButton();
    return self._button.init(selector + " > div[name='button']", "<i class='fa fa-caret-right'></i>", function (event) {
      function switch_detail() {
        var visible = !self._detail.visible();
        var remove_class = visible ? "fa-caret-right" : "fa-caret-down";
        var add_class = visible ? "fa-caret-down" : "fa-caret-right";
        var i = $(selector + " > div[name='button'] > i");
        i.removeClass(remove_class);
        i.addClass(add_class);
        self._detail.edit(self._edit);
        self._detail.visible(!visible);
      }
      if (self._detail == null) {
        // Create
        complex.append(DETAIL_TEMPLATE);
        self._detail = new Detail();
        self._detail.init(selector + " > div.detail", self._class.object_fields)
        .always(function() {
          self._detail.data(self._data);
          self._detail.refresh();
          self._detail.visible(false);
          switch_detail();
        });
        return;
      }
      switch_detail();
    });
  };

  function init_popup(self, id, detail) {
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
    //return detail.init('#' + id, self._class.object_fields);
  }
  
  function open_popup(self) {
    var detail = new Detail();
    var dialog = new Dialog();
    dialog.init(function(id) {
      return init_popup(self, id, detail);
      //return detail.init('#' + id, self._class.object_fields);
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
  }

  Complex.create_as_popup = function(self, selector) {
    var dfd = new $.Deferred;
    var complex = $(selector);
    complex.append(BUTTON_TEMPLATE);
    self._button = new DivButton();
    self._button.init(selector + " > div[name='button']", "<i class='fa fa-ellipsis-h'></i>", function(event) {
      open_popup(self);
    });
    dfd.resolve();
    return dfd.promise();
  };
  
  Complex.create_as_fixed = function(self, selector) {
    //var dfd = new $.Deferred;
    var complex = $(selector);
    complex.append(DETAIL_TEMPLATE);
    self._detail = new Detail();
    //self._detail.init(selector + " > div.detail", self._class.object_fields)
    //.then(function() {
    //  self._detail.data(self._data);
    //  self._detail.edit(self._edit);
    //  self._detail.refresh();
    //  self._detail.visible(true);
    //  dfd.resolve();
    //});
    //return dfd.promise();
    return self._detail.init(selector + " > div.detail", self._class.object_fields);
  };
  
  Complex.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    this._field = field;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Load template data & Create form tags
    var template = null;
    var self = this;
    var types = null;
    var type4log = null;
    $.when(
      Storage.read(Class.CLASS_ID, field.datatype.properties.class_id).done(function (data) { self._class = data; }),
      Storage.read(Class.COMPLEX_TYPE_ID).done(function (data) { types = data; })
    )
    .then(function() {
      var inner_dfd = new $.Deferred;

      root.append(TEMPLATE);

      var DEFAULT_TYPE_ID = "7cc4270b-cb00-4e84-ae7f-6138330f58f3"; // Folded
      var type_id = field.datatype.properties.type_id;
      type_id = !type_id ? DEFAULT_TYPE_ID : type_id;

      var type = types[type_id];
      if (!type || !type.id) {
        console.assert(false, "type is not exist, or type does not have 'id' property.");
        inner_dfd.reject();
        return inner_dfd.promise();
      }
      type4log = type;
      
      var generator = Complex[type.generator];
      if (typeof generator != "function") {
        console.assert(false, "'generator' is not function. (type.generator=[" + type.generator + "])");
        inner_dfd.reject();
        return inner_dfd.promise();
      }
      
      generator(self, selector + " > div.complex")
      .then(function () {
        self.visible(true);
        self.refresh();
        inner_dfd.resolve();
      });
      return inner_dfd.promise();
    })
    .then(function () {
      dfd.resolve();
    });
    
    return dfd.promise();
  };

  Complex.prototype.backup = function() {
    return this._backup;
  };

  Complex.prototype.commit = function() {
    this._backup = JSON.parse(JSON.stringify(this._data));
    if (this._detail) {
      this._detail.commit();
    }
  };

  Complex.prototype.restore = function() {
    this._data = JSON.parse(JSON.stringify(this._backup));
    if (this._detail) {
      this._detail.restore();
    }
  };

  Complex.prototype.edit = function(on) {
    this._edit = on;
    if (this._detail) {
      this._detail.edit(this._edit);
    }
  };

  Complex.prototype.data = function(values) {
    if (arguments.length == 0) {
      if (this._detail) {
        this._data = this._detail.data();
      }
      return this._data;
    } else {
      this._backup = values;
      this._data = values;
      if (this._detail) {
      	this._detail.data(this._data);
      }
    }
  };

  Complex.prototype.refresh = function() {
    if (this._detail) {
      this._detail.edit(this._edit);
      this._detail.visible(this._visible);
      this._detail.refresh();
    }
  };

  Complex.prototype.visible = function(_visible) {
    if (arguments.length == 0) {
      this._visible = this._detail.visible();
      return this._visible;
    }
    this._visible = _visible;
    if (this._detail) {
      this._detail.visible(this._visible);
    }
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
