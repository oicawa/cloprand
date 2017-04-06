define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Connector = require("core/Connector");
  var Storage = require("core/Storage");
  var Class = require("core/Class");
  var Tabs = require("core/Control/Tabs");

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
  
  Contents.prototype.init = function (selector) {
    var contents = $(selector);
    var classes = null;
    var template = null;
    var assist = null;
    var self = this;
    $.when(
      Utils.load_css("/core/Contents.css"),
      Connector.get("core/Contents.json", "json").done(function (data) { assist = data; })
    ).always(function() {
      contents.append(TEMPLATE);
      
      // Tabs
      self._tabs = new Tabs();
      self._tabs.init("#contents-tabs");
      for (var i = 0; i < assist.tabs.length; i++) {
        var tab = assist.tabs[i];
        self._tabs.add(tab.view_id, tab.class_id, tab.object_id)
        .then(function() {
          self._tabs.select(tab.view_id, tab.class_id, tab.object_id);
        })
        .then(function() {
          self._tabs.refresh(tab.view_id, tab.class_id, tab.object_id);
        });
      }
    });
  };
  
  return Contents;
});
