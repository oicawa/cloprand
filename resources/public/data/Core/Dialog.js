define(function (require) {
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Contents = require("data/Core/Contents");
  
  // Dialog
  function Dialog() {
    this._root = null;
    this._actions = null;
    this._title = null;
  };

  Dialog.prototype.close = function (event) {
    this._root.dialog("close");
  }
  
  Dialog.prototype.show = function () {
    this._root.dialog("open");
  };
  
  Dialog.prototype.bind = function (caption, func) {
    this._actions[caption] = func;
  };
  
  Dialog.prototype.init = function (selector, assist) {
  	var dfd = new $.Deferred;
    this._root = $(selector);
    this._actions = {};
    var self = this;
    
    // Create buttons
    var buttons = {};
    for (var i = 0; i < assist.buttons.length; i++) {
      var button = assist.buttons[i];
      var caption = button.caption;
      buttons[caption] = function (event) {
      	var text = event.currentTarget.textContent;
        var action = self._actions[text];
        if (!action) {
          alert("Implement [" + text + "] action");
          return;
        }
        action(event);
      };
    }

    // Create dialog
    this._root.dialog({
      autoOpen: false,
      height: "auto",
      width: "auto",
      appendTo: assist.selector,
      title: assist.title,
      closeOnEscape: true,
      modal: true,
      buttons: buttons
    });

    dfd.resolve();
    return dfd.promise();
  };
  
  return Dialog;
});
