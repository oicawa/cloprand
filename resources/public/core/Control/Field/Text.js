define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Inherits = require("core/Inherits");
  var DivButton = require("core/Control/DivButton");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<label></label><div><input style="color:black;"/><div name="languages" style="display:none;"/></div>';
  
  function Text() {
    Field.call(this, "core/Control/Field", "Text");
    this._properties = null;
    this._input = null;
    this._value = null;
  };
  Inherits(Text, Field);
  
  Text.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    
    var root = $(selector);
    root.append(TEMPLATE);

    // properties
    this._properties = Utils.value(
      { width : 200, is_require : false, default_ : "", multi_lingualization : false },
      function() { return field.datatype.properties; },
      false);
    var self = this;
    
    // Label
    var label = root.find("label");
    var caption = field.label;
    label.text(caption);

    // Input
    self._input = root.find("input");
    self._input.attr("name", field.name);
    self._input.css("width", this._properties.width);
    self._input.w2field("text");

    // Button
    var button_selector = selector + " > div > div[name='languages']";
    self._button = new DivButton();
    self._button.init(button_selector, "<i class='fa fa-flag'>")
    .then(function () {
      self._button.visible(self._properties.multi_lingualization);
      self._button.on("click", function (event) {
        self.multi_lingualize();
      });
      dfd.resolve();
    });
    
    return dfd.promise();
  };

  Text.prototype.multi_lingualize = function() {
  　console.log("Implement showing dialog to multi-lingualize.");
  };

  Text.prototype.backuped = function() {
    return this._value;
  };

  Text.prototype.commit = function() {
    this._value = this._input.val();
  };

  Text.prototype.restore = function() {
    this._input.val(this._value);
  };

  Text.prototype.edit = function(on) {
    this._input.attr("readonly", !on);
    this._button.visible(!this._properties.multi_lingualization ? false : on);
  };

  Text.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._input.val();
    } else {
      this._input.val(value);
      this._value = value;
    }
  };
  
  return Text;
}); 
