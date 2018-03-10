define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Locale = require("core/Locale");
  var Css = require("core/Css");
  
  var TEMPLATE = '<div></div>';
  
  function Toolbar() {
    this._root = null;;
    this._toolbar = null;
    this._css = null;
    this._instance = this;
    this._operations = {};
  }

  Toolbar.prototype.init = function(selector) {
    var dfd = new $.Deferred;

    if (typeof selector != "string") {
      // Behave as a wrapper
      
    }

    this._root = $(selector);
    this._root.hide();
    
    var self = this;
    
    Css.load("core/Control/Toolbar.css")
    .then(function() {
      self._root.append(TEMPLATE);
      var name = Uuid.version4();
      var toolbar = self._root.find("div");
      toolbar.w2toolbar({
        name : name,
      });
      self._toolbar = w2ui[name];
      self._toolbar.onClick = function (event) {
        var id = event.target;
        var item = self._toolbar.get(id);
        if (!item.action) {
          return;
        }
        //debugger;
        item.action(event);
      }
      self._root.hide();
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  Toolbar.prototype.items = function(items) {
    if (!items) {
      return;
    }
    
    this._toolbar.items = items;
    this.refresh();
  };
  
  Toolbar.prototype.refresh = function() {
    // !!! The follow logic is dirty hack !!!
    // <<Reason>>
    // The added all items are not displayed at once.
    // Calling 'refresh' method of toolbar once, only one displayed item is added in toolbar.
    // So, I implement it temporarily to call the 'refresh' method for the number of items.
    // This issue have to be investigated, and be fixed...
    for (var i = 0; i < this._toolbar.items.length; i++) {
      this._toolbar.refresh();
    }
  };

  Toolbar.prototype.visible = function(on) {
    if (on) {
      this._root.show();
      //this._toolbar.style(button_name);
    } else {
      this._root.hide();
    }
  };

  Toolbar.prototype.show = function(button_name) {
    this._toolbar.show(button_name);
  };

  Toolbar.prototype.hide = function(button_name) {
    this._toolbar.hide(button_name);
  };

  return Toolbar;
}); 
