define(function (require) {
  require("jquery");
  require("json2");
  require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("data/Core/Utils");
  var Contents = require("data/Core/Contents");

  var TEMPLATE = '' +
'<div id="root-panel">' +
'  <div id="header-panel" style="height: 30px;">' +
'    <img src="/data/Core/tames.svg" height="24px" width="24px" />' +
'    <span id="title" style="font-size:20px; vertical-align: top;"></span>' +
'    <span style="display:inline-block; width:30px;"></span>' +
'    <span id="sub-title"></span>' +
'    <form method="get" action="/logout" style="display:inline-block;position:absolute; right:0px;">' +
'      <span id="user_name"></span>' +
'      <input type="submit" value="Logout" />' +
'    </form>' +
'  </div>' +
'  <div id="contents-panel"></div>' +
'</div>';
  
  function App() {
    this._title = null;
    this._sub_title = null;
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
  
  App.prototype.sub_title = function() {
    return Utils.property_value(this, this._sub_title, "text", arguments);
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
    var self = this;
    
    Utils.get_session("user_name", function(data){ session = data; }, null)
    .fail(function(response, status) {
    	console.log(status);
    	//location.href = "/index.html";
    })
    .then(function() {
      $.when(
        Utils.get_data("System", "config", function(data){ config = data; })
      ).always(function() {
        $("body").append(TEMPLATE);

        self._title = $("span#title");
        self._sub_title = $("span#sub-title");
        self._user_name = $("span#user_name");
        self._config = config;

        self.title(config.system_name);
        self._user_name.text(session.user_name);

        self._contents = new Contents();
        self._contents.init("#contents-panel");
      });
    });
  };

  // Create instance, and use this instance as singleton.
  var app = new App();
  
  return app;
});
