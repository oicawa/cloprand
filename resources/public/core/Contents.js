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

  Contents.prototype.add = function () {
    var label = "New " + def_class.label;
    var tab_id = "object-" + (new Date()).getTime();
    this._tabs.add(tab_id, label, true);

    var detail = new Detail();
    detail.init("#" + tab_id + " > div.tab-contents-panel > div.object_detail", def_class.object_fields, assist_class, "name")
    .then(function() {
      detail.edit(true);
      detail.visible(true);
    });
    this._tabs.content(tab_id, detail);
  };
  
  Contents.prototype.show_tab = function (label, options, view_id, class_id, object_id) {
    var tab = this._tabs.get(view_id, class_id, object_id);
    if (!tab) {
      this._tabs.add(view_id, class_id, object_id);
    }
    this._tabs.select(view_id, class_id, object_id);
    this._tabs.refresh();
  };
  
  Contents.prototype.content = function (tab_id) {
    return this._tabs.content(tab_id);
  };
  
  Contents.prototype.remove = function (tab_id) {
    return this._tabs.remove(tab_id);
  };
  
  Contents.prototype.change = function (old_tab_id, new_tab_id, label) {
    return this._tabs.change(old_tab_id, new_tab_id, label);
  };
  
  Contents.prototype.label = function (tab_id, value) {
    return this._tabs.label(tab_id, value);
  };

  Contents.prototype.broadcast = function (class_id, object_id, options) {
    var key = { "class_id" : class_id, "object_id" : object_id, "options" : options };
    var keys = [key];
    this._tabs.broadcast(keys);
  }
  
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
        self._tabs.add(tab.view_id, tab.class_id, tab.object_id);
        self._tabs.select(tab.view_id, tab.class_id, tab.object_id);
        self._tabs.refresh();
      }
    });
  };
  
  return Contents;
});
