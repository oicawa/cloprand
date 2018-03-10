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
  
  function create_tab_id(view_id, class_id, object_id, suffix) {
    var array = [view_id, class_id, object_id];
    if (is_null_or_undefined(suffix) === false) {
      array.push(suffix);
    }
    var copied = array.concat();
    while(!copied[copied.length - 1]) {
      copied.pop();
    }
    return copied.join("_").replace(/\//g, "-");
  }

  function parse_tab_id(tab_id) {
    var ids = tab_id.split("_");
    var view_id = 0 < ids.length ? ids[0] : null;
    var class_id = 1 < ids.length ? ids[1] : null;
    var object_id = 2 < ids.length ? ids[2] : null;
    var suffix = 3 < ids.length ? ids[3] : null;
    return { "view_id" : view_id, "class_id" : class_id, "object_id" : object_id, "suffix" : suffix };
  }

  function create_view(self, view_id, class_id, object_id, options_) {
    var dfd = new $.Deferred;

    var options = is_null_or_undefined(options_) ? {} : options_;
    var suffix = is_null_or_undefined(options.suffix) ? null : options.suffix;

    // Append View Content Area
    var tab_id = create_tab_id(view_id, class_id, object_id, suffix);
    self._body.append(BODY_TEMPLATE);
    var tab_panel = self._body.find(".tab-panel:last-child");
    tab_panel.attr("id", tab_id);

    // Generate View
    Storage.read(Class.VIEW_ID, view_id)
    .done(function (object) {
      require([object.require_path], function(View) {
        var selector = "#" + tab_id + " > div.tab-content-frame > div.tab-content-panel";
        var view = new View();
        self._contents[tab_id] = view;
        view.init(selector, class_id, object_id, options.preset)
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

  Tabs.prototype.add = function (view_id, class_id, object_id, options_) {
    var options = is_null_or_undefined(options_) ? {} : options_;
    var closable = is_null_or_undefined(options.closable) ? true : options.closable;
    var suffix = is_null_or_undefined(options.suffix) ? null : options.suffix;
    var count = arguments.length;
    this._body.children(".tab-panel").hide();
    var dfd = new $.Deferred;
    var self = this;
    // Panel
    create_view(this, view_id, class_id, object_id, options)
    .then(function (view) {
      // Tab
      var tab_id = create_tab_id(view_id, class_id, object_id, suffix);
      self._tabs.add({"id":tab_id, "caption":view.caption(), "closable": closable });
      dfd.resolve(tab_id);
    })
    return dfd.promise();
  };

  Tabs.prototype.get = function (view_id, class_id, object_id, suffix) {
    var tab_id = create_tab_id(view_id, class_id, object_id, suffix);
    var tab = this._tabs.get(tab_id);
    if (!tab) {
      return null;
    }
    return {
      "view_id" : view_id,
      "class_id" : class_id,
      "object_id" : object_id,
      "suffix" : suffix,
      "caption" : tab.caption,
      "closable" : tab.closable,
      "tab_id" : tab.id
    };
  };

  Tabs.prototype.current = function () {
    if (this._history.length == 0) {
      return null;
    }
    var tab_id = this._history[this._history.length - 1];
    var ids = parse_tab_id(tab_id);
    var tab = this._tabs.get(tab_id);
    if (!tab) {
      return null;
    }
    return { "view_id" : ids.view_id, "class_id" : ids.class_id, "object_id" : ids.object_id, "caption" : tab.caption, "closable" : tab.closable };
  };

  Tabs.prototype.select = function (view_id, class_id, object_id, suffix) {
    var tab_id = create_tab_id(view_id, class_id, object_id, suffix);
    var tab = this._tabs.get(tab_id);
    this._body.children(".tab-panel").hide();
    this._tabs.select(tab_id);
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

  Tabs.prototype.show_tab = function (view_id, class_id, object_id, options) {
    var self = this;
    var suffix = is_null_or_undefined(options) ? null : options.suffix;
    var dfd = new $.Deferred;
    var tab = self.get(view_id, class_id, object_id, suffix);
    if (tab) {
      self.select(view_id, class_id, object_id, suffix);
      self.refresh(view_id, class_id, object_id, suffix);
      dfd.resolve(tab);
      return dfd.promise();
    }
    self.add(view_id, class_id, object_id, options)
    .then(function() {
      self.select(view_id, class_id, object_id, suffix);
      self.refresh(view_id, class_id, object_id, suffix);
      var tab = self.get(view_id, class_id, object_id, suffix);
      dfd.resolve(tab);
    });
    return dfd.promise();
  };

  Tabs.prototype.remove = function (view_id, class_id, object_id) {
    var tab_id = create_tab_id(view_id, class_id, object_id);
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

  Tabs.prototype.label = function (view_id, class_id, object_id, value) {
    var tab_id = create_tab_id(view_id, class_id, object_id);
    this._tabs.set(tab_id, { caption: value, text: value });
    this._tabs.refresh();
  };

  Tabs.prototype.broadcast = function (class_id, object_id, options) {
    var keys = [{ "class_id" : class_id, "object_id" : object_id, "options" : options }];
    for (var key in this._contents) {
      var view = this._contents[key];
      view.update(keys);
      view.refresh();
    }
  };

  Tabs.prototype.change = function (view_id, class_id, old_object_id, suffix, new_object_id, label) {
    var old_tab_id = create_tab_id(view_id, class_id, old_object_id, suffix);
    var new_tab_id = create_tab_id(view_id, class_id, new_object_id);
    var view = this._contents[old_tab_id];
    delete this._contents[old_tab_id];
    this._contents[new_tab_id] = view;
    //this._tabs.set(old_tab_id, {id:new_tab_id, caption:label, text:label});
    this._tabs.insert(old_tab_id, {id:new_tab_id, caption:label, text:label, closable:true});
    this._tabs.remove(old_tab_id);
    this._tabs.select(new_tab_id);
    // Must replace old_tab_id to new_tab_id in this._history.
    this._history.forEach(function (tab_id, index, array) {
      if (tab_id == old_tab_id) {
        this._history[index] = new_tab_id;
      }
    }, this);
    var panel = this._body.find("#" + old_tab_id);
    panel.attr("id", new_tab_id);
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
  
  Tabs.prototype.refresh = function (view_id, class_id, object_id) {
    if (arguments.length == 0) {
      this._tabs.refresh();
      return;
    }
    
    var tab_id = create_tab_id(view_id, class_id, object_id);
    this._tabs.refresh(tab_id);
  }
  
  return Tabs;
});
