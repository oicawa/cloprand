define(function (require) {
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  var Contents = require("data/Core/Contents");
  
  function init_buttons(actions) {
    for (var uuid in actions) {
      var action = actions[uuid];
      $("#" + uuid).on("click", action.proc);
    }
  }
  
  // Dialog
  function Dialog() {
    this._id = null;
    this._title = null;
    this._initializer = null;
    this._actions = null;
  };
  
  Dialog.show = function (message, title) {
    w2alert(message, title);
  };
  
  Dialog.confirm = function (message, title) {
    return w2confirm(message, title);
  };

  Dialog.prototype.close = function (event) {
    w2popup.close();
  }
  
  Dialog.prototype.show = function () {
    // Create div tag for this dialog area.
    this._id = Uuid.version4();
    
    var self = this;
    
    var buttons = "";
    for (var uuid in this._actions) {
      var action = this._actions[uuid];
      buttons += "<input type='button' style='min-width:100px;margin:2px;' id='" + uuid + "' value='" + action.caption + "'/>";
    }
    
    // Open this dialog.
    w2popup.open({
      title  : self._title,
      body    : "<div id='" + self._id + "'></div>",
      buttons : buttons,
      onOpen : function(event) {
        event.onComplete = function() {
          self._initializer(self._id);
          init_buttons(self._actions);
        };
      },
      onClose : function(event) {
        var panel = $("#" + self._id);
        panel.remove();
      }
    });
  };
  
  Dialog.prototype.title = function (title) {
    this._title = title;
  };
  
  Dialog.prototype.bind = function (action) {
    console.assert(action, "Specify action argument.");
    console.assert(action.id, "Specify action.id property.");
    console.assert(action.caption, "Specify action.caption property.");
    console.assert(action.proc, "Specify action.proc property as function object.");
    var uuid = Uuid.version4();
    this._actions[uuid] = action;
  };
  
  Dialog.prototype.init = function (initializer) {
  	var dfd = new $.Deferred;
    this._initializer = initializer;
    this._actions = {};
    var self = this;
    
    dfd.resolve();
    return dfd.promise();
  };
  
  return Dialog;
});
