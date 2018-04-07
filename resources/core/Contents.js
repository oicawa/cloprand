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

  function get_parameters() {
    var url = location.href;
    var index = url.indexOf("?");
    if (index < 0) {
      return null;
    }
    var query = url.substring(index + 1);
    var pairs = query.split(/&/g);
    var parameters = {};
    pairs.forEach(function (pair) {
      var fields = pair.split(/=/);
      parameters[fields[0]] = fields[1];
    });
    return parameters;
  }
  
  function regist_tab(self, parameters) {
    var dfd = new $.Deferred;
    var view_id = null;
    var class_id = parameters["class_id"];
    var object_id = parameters["object_id"];
    Storage.read(Class.CLASS_ID, class_id)
    .then(function (class_) {
      var options = class_.options;
      var SINGLE_TYPE = "ac9d589b-c421-40b8-9497-b0caaf24d017";
      var MULTI_TYPE = "b72dc321-5278-42da-8738-3503ae64bcad"
      if (options.id === SINGLE_TYPE) {
        // single
        view_id = options.properties.detail_view.id;
      } else if (options.id === MULTI_TYPE) {
        // multi
        var list_view_id = options.properties.list_view.id;
        var detail_view_id = options.properties.detail_view.id;
        view_id = is_null_or_undefined(object_id) ? list_view_id : detail_view_id;
      } else {
        return;
      }
      return Storage.personal("tabs");
    }).then(function (cache) {
      Tabs.regist_tab(cache, view_id, class_id, object_id, { "closable" : true });
    }).then(function () {
      dfd.resolve();
    });
    return dfd.promise();
  }
 
  Contents.prototype.init = function (selector) {
    var contents = $(selector);
    var classes = null;
    var template = null;
    var assist = null;
    var self = this;

    var dfd = new $.Deferred;

    // Require Redirect
    var parameters = get_parameters();
    if (parameters !== null)
    {
      regist_tab(self, parameters)
      .done(function() {
        location.href = Connector.base_url();
        dfd.resolve();
      });
      return dfd.promise();
    }

    Css.load("core/Contents.css")
    .then(function() {
      contents.append(TEMPLATE);
      self._tabs = new Tabs();
      return self._tabs.init("#contents-tabs");
    }).then(function(cache) {
      return self._tabs.restore();
    }).then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  return Contents;
});
