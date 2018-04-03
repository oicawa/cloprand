define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Connector = require("core/Connector");
  var Storage = require("core/Storage");
  var Class = require("core/Class");
  var Tabs = require("core/Control/Tabs");
  var Css = require("core/Css");

  var TEMPLATE = '' +
'<div id="contents-frame">' +
'  <div id="contents-tabs"></div>' +
'</div>';

  // Constructor
  function Contents() {
    this._tabs = null;
    this._assist = null;
  };
  
  Contents.get_tab_info = function (event) {
    // Get event source information
    var tab = $(event.originalEvent.target).closest("div.tab-panel");
    var tab_id = tab.prop("id");
    var tab_name = tab.attr("name");
    var ids = tab_name.split("_");
    var prefix = 0 < ids.length ? ids[0] : null;
    var class_id = 1 < ids.length ? ids[1] : null;
    var object_id = 2 < ids.length ? ids[2] : null;
    return {
      tab_id : tab_id,
      prefix : prefix,
      class_id : class_id,
      object_id : object_id
    };
  };

  Contents.prototype.tabs = function () {
    return this._tabs;
  };

  function init_tabs(self, tabs) {
    var dfd = new $.Deferred;
    var count = tabs.positions.length;
    if (count === 0) {
      dfd.resolve();
      return dfd.promise();
    }

    var tab_id = tabs.positions.shift();
    var tab = tabs.entries[tab_id];
    delete tabs.entries[tab_id];
    self._tabs.add(tab.view_id, tab.class_id, tab.object_id, tab.options)
    .then(function () {
      return init_tabs(self, tabs);
    }).then(function () {
      dfd.resolve();
    });
    return dfd.promise();
  }

  function get_url_parameters() {
    var url = location.href;
    var separator = url.indexOf('?');
    if (separator < 0) {
      return null;
    }
    var query = url.substring(separator + 1);
    console.log(query);
    var expressions = query.split('&');
    console.log(expressions);
    
    var parameters = {};
    expressions.forEach(function(expression, i) {
      var pair = expression.split('=');
      parameters[pair[0]] = pair[1];
    });
    console.log(parameters);
    return parameters;
  }

  function register_tab(self, parameters) {
    var dfd = new $.Deferred;

    Storage.read(Class.CLASS_ID, parameters.class_id)
    .done(function(class_){
      console.log(class_);
      var type_id = class_.options.id;
      var view_id = null;
      if (type_id === "ac9d589b-c421-40b8-9497-b0caaf24d017") {	// Single Item
        view_id = class_.options.properties.detail_view.id;
      } else if (type_id === "b72dc321-5278-42da-8738-3503ae64bcad") {
        var detail_view_id = class_.options.properties.detail_view.id;
        var list_view_id = class_.options.properties.list_view.id;
        view_id = is_null_or_undefined(parameters.object_id) ? list_view_id : detail_view_id;
      } else {
        // Not target
        return;
      }
      if (is_null_or_undefined(view_id)) {
        return;
      }
   	  return Tabs.regist(view_id, parameters.class_id, parameters.object_id, { "closable" : true });
    }).then(function () {
      dfd.resolve();
    });
    return dfd.promise();
  }
  
  Contents.prototype.init = function (selector) {
    var dfd = new $.Deferred;
    // With url parameters -> Regist tab & Redirect
    var params = get_url_parameters();
    if (params !== null) {
      register_tab(this, params)
      .then(function () {
        // Redirect
        location.href = Connector.base_url();
        dfd.resolved();
      });
      return dfd.promise();
    }
    
    var contents = $(selector);
    var classes = null;
    var template = null;
    var self = this;
    var tabs = Storage.personal("tabs");
    Css.load("core/Contents.css")
    .then(function () {
      contents.append(TEMPLATE);
      self._tabs = new Tabs();
      self._tabs.init("#contents-tabs");
      var clone = Utils.clone(tabs);
      return init_tabs(self, clone);
    }).then(function () {
      var length = tabs.history.length;
      var last_tab_id = tabs.history[length - 1];
      var last_tab = tabs.entries[last_tab_id];
      self._tabs.select(last_tab.view_id, last_tab.class_id, last_tab.object_id);
      self._tabs.refresh(last_tab.view_id, last_tab.class_id, last_tab.object_id);
      Storage.personal("tabs", tabs);	// Restore.
    }).then(function () {
      dfd.resolved();
    });
    return dfd.promise();
  };
  
  return Contents;
});
