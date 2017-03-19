define(function (require) {
  require("jquery");
  require("json2");
  require("w2ui");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Connector = require("core/Connector");
  var Storage = require("core/Storage");
  var Contents = require("core/Contents");
  var Tree = require("core/Control/Tree");

  var LAYOUT_TEMPLATE = '<div id="layout"></div>';
  var TOP_TEMPLATE = '' +
'<div id="header-panel" style="height: 30px;">' +
'  <img id="system-icon" />' +
'  <span id="title" style="font-size:20px; vertical-align: top;"></span>' +
'  <span style="display:inline-block; width:30px;"></span>' +
'  <span id="sub-title"></span>' +
'  <form method="get" name="signout" action="/logout" style="display:inline-block;position:absolute; right:5px;">' +
'    <span id="login_id" style"font-size:11pt;"></span>' +
'    <div class="div-button" style="display:inline-block;">' +
'      <i class="fa fa-sign-out" onclick="document.signout.submit();"></i>' +
'    </div>' +
'  </form>' +
'</div>';
  var LEFT_TEMPLATE = '<div id="left-panel"></div>';
  var MAIN_TEMPLATE = '<div id="contents-panel"></div>';
  
  function App() {
    this._layout = null;
    this._title = null;
    this._contents = null;
    this._login_id = null;
    this._config = null;
    this._primitives = null;
  }
  
  App.prototype.title = function() {
    if (arguments.length == 0) {
      return document.title;
    } else if (arguments.length == 1) {
      document.title = arguments[0];
    }
    return Utils.property_value(this, this._title, "text", arguments);
  };
  
  App.prototype.favicon = function(path) {
    // <link rel="shortcut icon" href="/image/15ab1b06-3756-48df-b045-728499aa9a6c/e71de065-9b6a-42c7-9987-ddc8e75672ca/favicon/tames.ico" />
    var icon = $("link[rel='shortcut icon']");
    icon.attr("href", path);
  };
  
  App.prototype.contents = function() {
    return this._contents;
  };
  
  App.prototype.config = function() {
    return this._config;
  };
  
  App.prototype.init = function() {
    var session = null;
    var self = this;
    var CONFIG_OBJECT_ID = "e71de065-9b6a-42c7-9987-ddc8e75672ca";
    $.when(
      Utils.load_css("core/app.css"),
      Connector.session("identity").done(function(data){ session = data; }),
      Storage.read(Class.SYSTEM_ID, CONFIG_OBJECT_ID).done(function(data){ self._config = data; }),
      Storage.read(Class.PRIMITIVE_ID).done(function(data){ self._primitives = data; })
    ).always(function() {
      $("body").append(LAYOUT_TEMPLATE);
      
      // Create Layout Panel
      var layout_name = Uuid.version4();
      var pstyle='border: 3px solid #dfdfdf; padding: 5px;';
      $("#layout").w2layout({
        name:layout_name,
        panels:[
          {type:'top', size:42, resizable:false, style:pstyle, content:TOP_TEMPLATE},
          {type:'left',size:200,resizable:true,hidden:true,style:pstyle,content:LEFT_TEMPLATE},
          {type:'main',style:pstyle,content:MAIN_TEMPLATE}
        ]
      });
      self._layout= w2ui[layout_name];
      self._layout.refresh();

      var logo_path = "/core/logo.svg";
      var favicon_path = "/core/favicon.ico";
      
      self._system_icon = $("img#system-icon");
      self._system_icon.attr("src", logo_path);
      
      self._title = $("span#title");
      self._login_id = $("span#login_id");
      
      self._contents = new Contents();
      self._contents.init("#contents-panel");
    
      self.title(self._config.system_name);
      self.favicon(favicon_path);
      self._login_id.text(session.identity);
      
      var tree = new Tree();
      tree.init("#left-panel");
    });
  };

  // Create instance, and use this instance as singleton.
  var app = new App();
  
  return app;
});
