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
  var List = require("core/Control/List");
  var Field = require("core/Control/Field/Field");
  var app = require("app");

  var TEMPLATE = '<div></div>';

  function Multi() {
    Field.call(this, "core/Control/Field", "Multi");
    this._list = null;
  };
  Inherits(Multi, Field);
  
  Multi.prototype.init = function(selector, field) {
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
    this._list = new List();
    
    this._list.init(selector + " > div", options)
    .then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  };

  Multi.prototype.backuped = function() {
    return this._list.backuped();
  };

  Multi.prototype.commit = function() {
    this._list.commit();
  };

  Multi.prototype.restore = function() {
    this._list.restore();
  };

  Multi.prototype.edit = function(on) {
    this._list.edit(on);
  };

  Multi.prototype.data = function(values) {
    if (arguments.length == 0) {
      return this._list.data();
    } else {
      this._list.data(values);
    }
  };
  
  Multi.prototype.refresh = function(on) {
    this._list.refresh();
  };

  return Multi;
}); 
