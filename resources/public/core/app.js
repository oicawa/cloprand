define(function (require) {
  require("jquery");
  require("json2");
  require("w2ui");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Connector = require("core/Connector");
  var Contents = require("core/Contents");

  var LAYOUT_TEMPLATE = '<div id="layout"></div>';
  var TOP_TEMPLATE = '' +
'<div id="header-panel" style="height: 30px;">' +
'  <img id="system-icon" />' +
'  <span id="title" style="font-size:20px; vertical-align: top;"></span>' +
'  <span style="display:inline-block; width:30px;"></span>' +
'  <span id="sub-title"></span>' +
'  <form method="get" action="/logout" style="display:inline-block;position:absolute; right:5px;">' +
'    <span id="account_id"></span>' +
'    <input type="submit" value="Logout" />' +
'  </form>' +
'</div>';
  var LEFT_TEMPLATE = '<div id="left-panel"></div>';
  var MAIN_TEMPLATE = '<div id="contents-panel"></div>';
  
  function App() {
    this._layout = null;
    this._title = null;
    this._contents = null;
    this._account_id = null;
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
  
  App.prototype.contents = function() {
    return this._contents;
  };
  
  App.prototype.config = function() {
    return this._config;
  };
  
  App.prototype.init = function() {
    var config = null;
    var primitives = null;
    var session = null;
    
    Utils.load_css("core/app.css");
    
    var self = this;
    $.when(
      Connector.session("identity", function(data){ session = data; }, null),
      Connector.crud.read("/api/" + Utils.SYSTEM_ID, "json", function(data){ config = data[0]; }),
      Connector.crud.read("/api/" + Utils.PRIMITIVE_ID, "json", function(data){ primitives = data; })
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
      
      self._system_icon = $("img#system-icon");
      self._system_icon.attr("src", "/image/" + Utils.SYSTEM_ID + "/" + config.id + "/logo/tames.svg");
      
      self._title = $("span#title");
      self._account_id = $("span#account_id");
      
      self._contents = new Contents();
      self._contents.init("#contents-panel");
      
      self._config = config;
      self.title(config.system_name);
      self._account_id.text(session.identity);
      
      self._primitives = {};
      for (var i = 0; i < primitives.length; i++) {
        var primitive = primitives[i];
        self._primitives[primitive.id] = primitive;
      }
    });
  };

  // Create instance, and use this instance as singleton.
  var app = new App();
  
  return app;
});
