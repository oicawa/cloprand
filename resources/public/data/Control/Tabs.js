define(function (require) {
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  
  var FRAME_TEMPLATE = ''+
    '<div class="tabs-header"></div>' +
    '<div class="tabs-body"></div>';
  var BODY_TEMPLATE = ''+
    '<div class="tab-panel">' +
    '  <div class="tab-content-frame">' +
    '    <div class="tab-content-panel"></div>' +
    '  </div>' +
    '</div>';
  
  function active(self, index) {
    // Activate the created new tab
    self._tabs.tabs({ active : index});
  }
  
  function Tabs () {
    this._root = null;
    this._tabs = null;
    this._body = null;
    this._contents = null;
  }

  Tabs.create_tab_id = function(parts) {
    var copied = parts.concat();
    while(!copied[copied.length - 1])
      copied.pop();
    return copied.join("_").replace(/\//g, "-");
  }

  Tabs.prototype.add = function (tab_id, label, set_active, is_closable) {
    //var closable = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>";
    //var unclosable = "<li class='tab-label'><a href='#{href}'>#{label}</a></li>";
    //var tabTemplate = !is_closable ? unclosable : closable;
    //var li = $(tabTemplate.replace( /#\{href\}/g, "#" + tab_id ).replace( /#\{label\}/g, label ) );
    //this._tabs.find(".ui-tabs-nav").append(li);
    //this._tabs.append("<div id='" + tab_id + "' class='tab-panel'><div class='tab-content-frame'><div class='tab-content-panel'></div></div></div>");
    //this._tabs.tabs("refresh");

    //if (!set_active) {
    //  return;
    //}
    //var i = index(this, tab_id);
    //active(this, i);
    
    this._tabs.add({id: tab_id, caption: label, closable: is_closable});
    this._body.append(BODY_TEMPLATE);
    var tab_contents = this._body.find(".tab-panel:last-child");
    tab_contents.attr("id", tab_id);
  };

  Tabs.prototype.content = function (tab_id, content) {
    if (arguments.length == 1) {
      return this._contents[tab_id];
    } else if (arguments.length == 2) {
      this._contents[tab_id] = content;
    } else {
      console.assert(false, "Tabs.content() method requires 1 or 2 arguments. (specified arguments = " + arguments + ")");
    }
  };

  Tabs.prototype.get = function (tab_id) {
    return this._tabs.get(tab_id);
  };

  Tabs.prototype.select = function (tab_id) {
    var tab = this._tabs.get(tab_id);
    console.log(tab);
    this._body.children(".tab-panel").css("display", "none");
    this._tabs.select(tab_id);
    this._body.find("#" + tab_id).css("display", "block");
  };

  Tabs.prototype.remove = function (tab_id) {
    this._body.find("#" + tab_id).remove();
  };

  Tabs.prototype.label = function (tab_id, value) {
    var li = this._tabs.find("ul > li[aria-controls='" + tab_id + "']");
    var a = li.find("a");
    a.text(value);
  };

  Tabs.prototype.broadcast = function (keys) {
    for (var key in this._contents) {
      var view = this._contents[key];
      view.update(keys);
    }
  };

  Tabs.prototype.change = function (old_id, new_id, label) {
    var li = this._tabs.find("ul > li[aria-controls='" + old_id + "']");
    var a = li.find("a");
    a.attr("href", "#" + new_id);
    a.text(label);
    li.attr("aria-controls", new_id);
    var div = this._tabs.find("div#" + old_id);
    div.attr("id", new_id);
    var content = this._contents[old_id];
    delete this._contents[old_id];
    this._contents[new_id] = content;
  };

  Tabs.prototype.init = function (selector) {
    //this._tabs = $(selector);
    //// Create tab object by jQuery
    //var self = this;
    //this._tabs.tabs({
    //  active: 1,
    //  activate: function( event, ui ) {
    //    var tab_id = ui.newPanel.selector.substring(1);
    //    var view = self._contents[tab_id];
    //    if (!view)
    //      return;
    //    if (view.refresh)
    //      view.refresh();
    //  }
    //});
    this._contents = {};
    //var self = this;
    //// Set close button on each tab
    //this._tabs.on("click", "span.ui-icon-close", function() {
    //  var panelId = $(this).closest("li").remove().attr("aria-controls");
    //  $("#" + panelId ).remove();
    //  self._tabs.tabs("refresh");
    //});
    
    this._root = $(selector);
    this._root.append(FRAME_TEMPLATE);
    
    var header_id = Uuid.version4();
    var header = this._root.find('.tabs-header');
    header.attr("id", header_id);
    
    var self = this;
    
    var tabs_name = Uuid.version4();
    var tabs = header.w2tabs({
      name: tabs_name,
      onClick: function(event) {
        self.select(event.tab.id);
      },
      onClose: function (event) {
        event.onComplete = function(completeEvent) {
          self.remove(event.object.id);
        }
      }
    });
    this._tabs = w2ui[tabs_name];
    
    this._body = this._root.find('.tabs-body');
  };
  
  return Tabs;
});
