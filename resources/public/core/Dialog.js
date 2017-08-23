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
    
    this._id = Uuid.version4();
    var contents_id = Uuid.version4();
    var html = DIALOG_TEMPLATE.replace(/{{DIALOG_ID}}/, this._id).replace(/{{CONTENTS_ID}}/, contents_id);
    $('body').append(html);
    
    this._dialog = $('#' + this._id);
    console.log("Dialog ID = " + this._id);
    
    var self = this;
    
    var body = $("body");
    
    initializer(contents_id)
    .then(function() {
      self._dialog.dialog({
        modal : true,
        width : 'auto',
        height : 'auto',
        maxHeight : body.height() - 20,
        maxWidth : body.width() - 20,
        close : function (event, ui) {
          self._dialog.remove();
        },
        resize : function (event) {
          console.log("Dialog (ID:" + this._id + ") resize.");
        }
      });
      dfd.resolve();
    });
    
    return dfd.promise();
  };
  
  return Dialog;
});
