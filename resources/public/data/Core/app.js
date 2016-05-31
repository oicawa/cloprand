define(function (require) {
  require("jquery");
  require("json2");
  require("w2ui");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  var Connector = require("data/Core/Connector");
  var Contents = require("data/Core/Contents");

  var LAYOUT_TEMPLATE = '<div id="layout"></div>';
  var TOP_TEMPLATE = '' +
'<div id="header-panel" style="height: 30px;">' +
'  <img src="/image/System/config/logo/tames.svg" />' +
'  <span id="title" style="font-size:20px; vertical-align: top;"></span>' +
'  <span style="display:inline-block; width:30px;"></span>' +
'  <span id="sub-title"></span>' +
'  <form method="get" action="/logout" style="display:inline-block;position:absolute; right:0px;">' +
'    <span id="user_name"></span>' +
'    <input type="submit" value="Logout" />' +
'  </form>' +
'</div>';
  var LEFT_TEMPLATE = '<div id="left-panel"></div>';
  var MAIN_TEMPLATE = '<div id="contents-panel"></div>';
  
  function App() {
    this._layout = null;
    this._title = null;
    this._contents = null;
    this._user_name = null;
    this._config = null;
  }
  
  App.prototype.title = function() {
    if (arguments.length == 0) {
      return document.title;
    } else if (arguments.length == 1) {
      document.title = arguments[0];
    }
    return Utils.property_value(this, this._title, "text", arguments);
  };
  
  App.prototype.contents = function() {
    return this._contents;
  };
  
  App.prototype.config = function() {
    return this._config;
  };
  
  App.prototype.init = function() {
    var config = null;
    var session = null;
    
    Utils.load_css("data/Core/app.css");
    
    var self = this;
    $.when(
      Connector.session("user_name", function(data){ session = data; }, null),
      Connector.crud.read("/api/System/config", "json", function(data){ config = data; })
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
      
      self._title = $("span#title");
      
      self._contents = new Contents();
      self._contents.init("#contents-panel");
      
      self._config = config;
      self.title(config.system_name);
    });
  };

  // Create instance, and use this instance as singleton.
  var app = new App();
  
  return app;
});
