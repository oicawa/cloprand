define(function (require) { 
  require("jquery");
  var Uuid = require("core/Uuid");
  
  var TEMPLATE = '<div id="{{BUTTON_ID}}" class="div-button" style="display:inline-block;">{{CONTENT}}</div>';

  function DivButton() {
    this._button = null;
    this._click = null;
  }

  DivButton.prototype.init = function(selector, content, callback) {
    var dfd = new $.Deferred;

    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    var uuid = Uuid.version4();
    var html = TEMPLATE.replace(/{{BUTTON_ID}}/, uuid).replace(/{{CONTENT}}/, content);
    root.empty();
    root.append(html);

    var self = this;
    this._button = root.find("#" + uuid);
    this._button.on("click", callback);
    
    dfd.resolve();
    return dfd.promise();
  };

 return DivButton;
}); 
