define(function (require) { 
  require("jquery");
  require("w2ui");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Dialog = require("core/Dialog");
  var Inherits = require("core/Inherits");
  var List_ = require("core/Control/List");
  var Field = require("core/Control/Field/Field");
  var app = require("app");

  var TEMPLATE = '<div></div>';

  function List() {
    Field.call(this, "core/Control/Field", "List");
    this._list = null;
  };
  Inherits(List, Field);

  List.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;

    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    root.append(TEMPLATE);

    var options = Utils.get_as_json(
      { "class_id" : null, "width" : 500, "height" : 200, "actions" : [], "toolbar_items" : [] },
      function() { return field.datatype.properties; }
    );
    
    // Create controls
    this._list = new List_();
    
    this._list.init(selector + " > div", options)
    .then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  };

  List.prototype.backup = function() {
    return this._list.backup();
  };

  List.prototype.commit = function() {
    this._list.commit();
  };

  List.prototype.restore = function() {
    this._list.restore();
  };

  List.prototype.edit = function(on) {
    this._list.edit(on);
  };

  List.prototype.data = function(values) {
    if (arguments.length == 0) {
      return this._list.data();
    } else {
      this._list.data(values);
    }
  };
  
  List.prototype.refresh = function(on) {
    this._list.refresh();
  };

  return List;
}); 
