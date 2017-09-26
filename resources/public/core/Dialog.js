define(function (require) {
  require("jquery");
  require("jquery_ui");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Contents = require("core/Contents");
  
  var DIALOG_TEMPLATE = '' +
'<div class="dialog" id="{{DIALOG_ID}}" style="display:none;">' +
'  <div id="{{CONTENTS_ID}}"></div>' +
'</div>';
  
  function Dialog() {
    this._id = null;
    this._dialog = null;
  };
  
  Dialog.show = function (message, title) {
    w2alert(message, title);
  };
  
  Dialog.confirm = function (message, title) {
    return w2confirm(message, title);
  };

  Dialog.prototype.close = function () {
    this._dialog.dialog('close');
  }
  
  Dialog.prototype.open = function () {
    this._dialog.dialog('open');
  };
  
  Dialog.prototype.title = function (title) {
    this._dialog.dialog({ title : title });
  };
  
  Dialog.prototype.buttons = function (buttons) {
    this._dialog.dialog({ buttons : buttons });
  };
  
  Dialog.prototype.size = function (width, height) {
    this._dialog.dialog({
      width : width,
      height: height
    });
  };
  
  Dialog.prototype.init = function (initializer) {
    var dfd = new $.Deferred;
    
    var dialog_id = Uuid.version4();
    var contents_id = Uuid.version4();
    var html = DIALOG_TEMPLATE.replace(/{{DIALOG_ID}}/, dialog_id).replace(/{{CONTENTS_ID}}/, contents_id);
    var body = $("body");
    body.append(html);
    var self = this;
    
    this._id = dialog_id;
    this._dialog = $('#' + this._id);
    
    initializer(contents_id)
    .then(function() {
      self._dialog.dialog({
        modal : true,
        width : 'auto',
        height : 'auto',
        autoOpen : false,
        maxHeight : body.height() - 20,
        maxWidth : body.width() - 20,
        close : function (event, ui) {
          self._dialog.remove();
        },
        resize : function (event) {
          console.log("Dialog (ID:" + self._id + ") resize.");
        }
      });
      dfd.resolve();
    });
    
    return dfd.promise();
  };
  
  return Dialog;
});
