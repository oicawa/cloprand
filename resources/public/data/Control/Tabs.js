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
  
  function get_tab_id(self, tab_name_or_id) {
    return Uuid.is_uuid(tab_name_or_id) ? tab_name_or_id : self._idmap[tab_name_or_id];
  }
  
  function Tabs () {
    this._root = null;
    this._tabs = null;
    this._idmap = {};
    this._body = null;
    this._contents = {};
    this._history = [];
  }

  Tabs.create_tab_name = function(parts) {
    var copied = parts.concat();
    while(!copied[copied.length - 1])
      copied.pop();
    return copied.join("_").replace(/\//g, "-");
  };

  Tabs.prototype.add = function (tab_name, label, set_active, is_closable) {
    var tab_id = Uuid.version4();
    this._idmap[tab_name] = tab_id;
    this._tabs.add({id: tab_id, caption: label, closable: is_closable});
    this._body.append(BODY_TEMPLATE);
    var tab_contents = this._body.find(".tab-panel:last-child");
    tab_contents.attr("id", tab_id);
    tab_contents.attr("name", tab_name);
    this._tabs.refresh();
  };

  Tabs.prototype.content = function (tab_name_or_id, content) {
    var tab_id = get_tab_id(this, tab_name_or_id);
    if (arguments.length == 1) {
      return this._contents[tab_id];
    } else if (arguments.length == 2) {
      this._contents[tab_id] = content;
    } else {
      console.assert(false, "Tabs.content() method requires 1 or 2 arguments. (specified arguments = " + arguments + ")");
    }
  };

  Tabs.prototype.get = function (tab_name_or_id) {
    var tab_id = get_tab_id(this, tab_name_or_id);
    return this._tabs.get(tab_id);
  };

  Tabs.prototype.select = function (tab_name_or_id) {
    var tab_id = get_tab_id(this, tab_name_or_id);
    var tab = this._tabs.get(tab_id);
    this._body.children(".tab-panel").hide();
    this._tabs.select(tab_id);
    this._body.find("#" + tab_id).show();
    var view = this._contents[tab_id];
    if (view)
      view.refresh();
    
    if (this._history.length == 0) {
      this._history = [tab_id];
      return;
    }
    var last = this._history.length - 1;
    var last_tab_id = this._history[last];
    if (tab_id == last_tab_id) {
      return;
    }
    if (tab.closable) {
      this._history.push(tab_id);
    } else {
      this._history = [tab_id];
    }
  };

  Tabs.prototype.remove = function (tab_name_or_id) {
    var tab_id = get_tab_id(this, tab_name_or_id);
    this._body.find("#" + tab_id).remove();
    this._tabs.remove(tab_id);
    
    var history = this._history.filter(function(id) {
      if (tab_id == id) {
        return false;
      }
      var tab = this._tabs.get(id);
      return tab == null ? false : true;
    }, this);
    
    var last_tab_id = history.pop();
    this._history = history;
    this.select(last_tab_id);
  };

  Tabs.prototype.label = function (tab_name_or_id, value) {
    var tab_id = get_tab_id(this, tab_name_or_id);
    this._tabs.set(tab_id, { caption: value });
    this._tabs.refresh();
  };

  Tabs.prototype.broadcast = function (keys) {
    for (var key in this._contents) {
      var view = this._contents[key];
      view.update(keys);
      view.refresh();
    }
  };

  Tabs.prototype.change = function (old_name, new_name, label) {
    //this._tabs.remove(old_id);
    //this._tabs.refresh();
    //this.remove(old_id);
    //var content = this._contents[old_id];
    //delete this._contents[old_id];
    
    //this.add(new_id, label, true, true);
    //this.content(new_id, content);
    //this.select(new_id);
    
    var tab_id = this._idmap[old_name];
    delete this._idmap[old_name];
    this._idmap[new_name] = tab_id;
    this._tabs.set(tab_id, {caption: label});
  };
  
  Tabs.prototype.tab_id = function(tab_name) {
    var tab_id = this._idmap[tab_name];
    return tab_id;
  };

  Tabs.prototype.init = function (selector) {
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
