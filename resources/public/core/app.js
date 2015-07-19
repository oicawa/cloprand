define(function (require) {
  require("jquery");
  require("json2");
  require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Contents = require("Contents");
  
  function App() {
    this._title = null;
    this._sub_title = null;
    this._contents = null;
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
  
  App.prototype.init = function() {
    var template = null;
    var config = null;
    var self = this;
    $.when(
      Utils.get_file(null, "App.html", "html", function(data){ template = $.templates(data); }),
      Utils.get_file(null, "config.json", "json", function(data){ config = data; })
    ).always(function() {
      var root_html = template.render();
      $("body").append(root_html);
      //$('#root-panel').css({width: '100%', height: '100%'}).split({orientation: 'horizontal', limit: 20, position: '30px', invisible: true, fixed: true});

      self._title = $("span#title");
      self._sub_title = $("span#sub-title");
      
      self.title(config.label);

      self._contents = new Contents();
      self._contents.init("#contents-panel");
    });
  };

  // Create instance, and use this instance as singleton.
  var app = new App();
  
  return app;
});
