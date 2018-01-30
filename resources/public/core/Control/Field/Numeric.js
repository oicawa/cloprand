define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<div><input style="color:black; text-align:right;"/></div>';
  
  function Numeric() {
    Field.call(this, "core/Control/Field", "Numeric");
    this._input = null;
    this._value = null;
    this._field = null;
    this._options = null;
    this._parse = null;
  };
  Inherits(Numeric, Field);
  
  Numeric.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    root.append(TEMPLATE);
    
    this._input = root.find("input");
    this._input.attr("name", field.name);
    
    this._options = Utils.merge(field.datatype.properties, { "precision" : 0, "autoFormat" : true, min : null, max : null });
    this._parse = this._options.precision == 0 ? parseInt : parseFloat;
    this._field = this._input.w2field(this._options == 0 ? "int" : "float", this._options);
    
    dfd.resolve();
    return dfd.promise();
  };

  Numeric.prototype.backup = function() {
    return this._value;
  };

  Numeric.prototype.commit = function() {
    this._value = this.data();
  };

  Numeric.prototype.restore = function() {
    this._field.val(this._value);
  };

  Numeric.prototype.edit = function(on) {
    this._input.attr("readonly", !on);
  };

  Numeric.prototype.data = function(value) {
    if (arguments.length == 0) {
      var v = this._field.val();
      v = v.replace(/,/g, '');
      return v === "" ? null : this._parse(v);
    }
    
    if (value == null) {
      this._field.val("");
      this._value = value;
    } else {
      this._field.val(this._parse(value));
      this._value = this._parse(value);
    }
  };
  
  return Numeric;
}); 
