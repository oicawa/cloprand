define(function (require) { 
  require("jquery");
  var Uuid = require("core/Uuid");
  
  var TEMPLATE = '<div id="{{BUTTON_ID}}" class="div-button" style="display:inline-block;">{{CONTENT}}</div>';

  function DivButton() {
    this._root = null;
    this._button = null;
    this._click = null;
  }

  DivButton.prototype.init = function(selector, content, callback) {
    var dfd = new $.Deferred;

    this._root = $(selector);
    if (0 < this._root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    var uuid = Uuid.version4();
    var html = TEMPLATE.replace(/{{BUTTON_ID}}/, uuid).replace(/{{CONTENT}}/, content);
    this._root.empty();
    this._root.append(html);

    var self = this;
    this._button = this._root.find("#" + uuid);
    this._button.on("click", callback);
    this._button.on("keyup", function (event) {
      console.log(event);
    });
    
    dfd.resolve();
    return dfd.promise();
  };

  DivButton.prototype.visible = function(value) {
    this._root.css("display", value ? "inline-block" : "none");
  };
  
  DivButton.prototype.on = function(event_name, callback) {
    this._button.on(event_name, callback);
  };
  
  return DivButton;
}); 
