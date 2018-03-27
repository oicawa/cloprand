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

  var timer = false;
  $(window).on("resize", function () {
    if (timer !== false) {
      clearTimeout(timer);
    }
    timer = setTimeout(function() {
      console.log('window resized');
      var body = $("body");
      var divs = body.find("div[role='dialog'] > div.dialog");
      for (var i = 0; i < divs.length; i++) {
        var dialog = $("#" + divs[i].id);
        dialog.dialog({
          maxHeight : body.height() - 20,
          maxWidth : body.width() - 20
        });
      }
    }, 200);
  });
  
  function Dialog() {
    this._id = null;
    this._dialog = null;
  };
  
  Dialog.show = function (message, title) {
    var dialog = new Dialog();
    dialog.init(function (id) {
      var dfd = new $.Deferred;
      var div = $("#" + id);
      div.append("<p>" + message + "</p>");
      div.css("min-height", "100px");
      div.css("min-width", "400px");
      dfd.resolve();
      return dfd.promise();
    })
    .then(function () {
      dialog.title(title);
      dialog.buttons([{ text:"OK", click:function(event){dialog.close();}}]);
      dialog.open();
    });
  };
  
  Dialog.confirm = function (message, title) {
    //return w2confirm(message, title);
    var proc_yes = null;
    var proc_no = null;
    var procs = {
      yes:function (func) { proc_yes = func; return procs; },
      no:function (func) { proc_no = func; return procs; }
    }
    var dialog = new Dialog();
    dialog.init(function (id) {
      var dfd = new $.Deferred;
      var div = $("#" + id);
      div.append("<p>" + message + "</p>");
      div.css("min-height", "100px");
      div.css("min-width", "400px");
      dfd.resolve();
      return dfd.promise();
    })
    .then(function () {
      dialog.title(title);
      dialog.buttons([
        { text:"Yes", click:function(event){dialog.close(); if (typeof proc_yes == "function") proc_yes();}},
        { text:"No", click:function(event){dialog.close(); if (typeof proc_no == "function") proc_no();}}
      ]);
      dialog.open();
    });
    return procs;
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
