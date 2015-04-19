define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  return function (selector) {
    var _tabs = $(selector);
    var _instance = this;

    function index(tab_id) {
      return _tabs.find("ul > li[aria-controls='" + tab_id + "']").index();
    }

    function active(index) {
      // Activate the created new tab
      _tabs.tabs({ active : index});
    }

    this.add = function(tab_id, label, set_active) {
      var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
      var li = $(tabTemplate.replace( /#\{href\}/g, "#" + tab_id ).replace( /#\{label\}/g, label ) );
      _tabs.find(".ui-tabs-nav").append(li);
      _tabs.append("<div id='" + tab_id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
      _tabs.tabs("refresh");

      if (!set_active) {
        return;
      }
      var i = index(tab_id);
      active(i);
    };

    this.show = function(tab_id) {
      var i = index(tab_id);
      if (i < 0) {
        return false;
      }
      active(i);
      return true;
    };

    this.remove = function(tab_id) {
      var i = index(tab_id);
      if (i < 0) {
        return false;
      }
      var panelId = $("#" + tab_id).remove().attr("aria-controls");
      $("#" + panelId ).remove();
      _tabs.tabs("refresh");
      return true;
    };

    this.change = function(old_id, new_id, label) {
      var li = _tabs.find("ul > li[aria-controls='" + old_id + "']");
      var a = li.find("a");
      a.attr("href", "#" + new_id);
      a.text(label);
      li.attr("aria-controls", new_id);
      var div = _tabs.find("div#" + old_id);
      div.attr("id", new_id);
    };

    this.init = function() {
      // Create tab object by jQuery
      _tabs.tabs({active: 1});

      // Set close button on each tab
      _tabs.on("click", "span.ui-icon-close", function() {
        var panelId = $(this).closest("li").remove().attr("aria-controls");
        $("#" + panelId ).remove();
        _tabs.tabs("refresh");
      });
    };
  };
});
