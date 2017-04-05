define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  
  var FRAME_TEMPLATE = ''+
    '<div class="tabs-header"></div>' +
    '<div class="tabs-body"></div>';
  var BODY_TEMPLATE = ''+
    '<div class="tab-panel">' +
    '  <div class="tab-content-frame">' +
    '    <div class="tab-content-panel"></div>' +
    '  </div>' +
    '</div>';
  
  function create_tab_id(view_id, class_id, object_id) {
    var array = [view_id, class_id, object_id];
    var copied = array.concat();
    while(!copied[copied.length - 1])
      copied.pop();
    return copied.join("_").replace(/\//g, "-");
  }

  function create_view(self, view_id, class_id, object_id) {
    var dfd = new $.Deferred;

    // Append View Content Area
  	var tab_id = create_tab_id(view_id, class_id, object_id);
    self._body.append(BODY_TEMPLATE);
    var tab_panel = self._body.find(".tab-panel:last-child");
    tab_panel.attr("id", tab_id);

    // Generate View
    Storage.read(Class.VIEW_ID, view_id)
    .done(function (object) {
      require([object.require_path], function(View) {
        var selector = "#" + tab_id + " > div.tab-content-frame > div.tab-content-panel";
        console.log("object.require_path=" + object.require_path);
        var view = new View();
        self._contents[tab_id] = view;
        view.init(selector, class_id, object_id)
        .then(function(view_) {
          dfd.resolve(view_);
        });
      });
    })
    return dfd.promise();
  }
  
  function active(self, index) {
    // Activate the created new tab
    self._tabs.tabs({ active : index});
  }
  
  function Tabs () {
    this._root = null;
    this._tabs = null;
    this._idmap = {};
    this._body = null;
    this._contents = {};
    this._history = [];
  }

  Tabs.prototype.add = function (view_id, class_id, object_id) {
    var dfd = new $.Deferred;
    var self = this;
    // Panel
    create_view(this, view_id, class_id, object_id)
    .then(function (view) {
      // Tab
      var tab_id = create_tab_id(view_id, class_id, object_id);
      self._tabs.add({"id":tab_id, "caption":view.caption()});
      dfd.resolve();
    })
    return dfd.promise();
  };

  Tabs.prototype.get = function (view_id, class_id, object_id) {
    var tab_id = create_tab_id(view_id, class_id, object_id);
    return this._tabs.get(tab_id);
  };

  Tabs.prototype.select = function (view_id, class_id, object_id) {
    var tab = this._tabs.get(view_id, class_id, object_id);
    this._body.children(".tab-panel").hide();
    this._tabs.select(view_id, class_id, object_id);
    
    var tab_id = create_tab_id(view_id, class_id, object_id);
    this._body.find("#" + tab_id).show();
    var view = this._contents[tab_id];
    if (view) {
      view.refresh();
    }
    
    if (this._history.length == 0) {
      this._history = [tab_id];
      return;
    }
    var last = this._history.length - 1;
    var last_tab_id = this._history[last];
    if (tab_id == last_tab_id) {
      return;
    }
    if ((!tab) || (!tab.closable)) {
      this._history = [tab_id];
    } else {
      this._history.push(tab_id);
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
    this._tabs.set(tab_id, { caption: value, text: value });
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
    var tab_id = this._idmap[old_name];
    delete this._idmap[old_name];
    this._idmap[new_name] = tab_id;
    this._tabs.set(tab_id, {caption: label, text: label});
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
  
  Tabs.prototype.refresh = function () {
    this._tabs.refresh();
  }
  
  return Tabs;
});
