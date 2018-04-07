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

  function save_cache(cache) {
    return Storage.personal("tabs", cache);
  }

  function init_tabs(self) {
    var MENU_VIEW_ID = "676138ed-aee1-4d6d-a8d8-c114042b1833";
    var TAB_ID = MENU_VIEW_ID + "_" + Class.CLASS_ID;
    var MENU_ENTRY = {
      "tab_id" : TAB_ID,
      "view_id" : MENU_VIEW_ID,
      "class_id" : Class.CLASS_ID,
      "object_id" : null,
      "options" : {"closable"  : false}
    };
    if (is_null_or_undefined(self._cache)) {
      self._cache = { "entries" : {}, "positions" : [TAB_ID], "history" : [TAB_ID] };
      self._cache.entries[TAB_ID] = MENU_ENTRY;
    }
    if (is_null_or_undefined(self._cache["entries"])) {
      self._cache["entries"] = {};
      self._cache.entries[TAB_ID] = MENU_ENTRY;
    }
    if (is_null_or_undefined(self._cache["positions"])) {
      self._cache["positions"] = [TAB_ID];
    }
    if (is_null_or_undefined(self._cache["history"])) {
      self._cache["history"] = [TAB_ID];
    }
    return save_cache(self._cache);
  }

  function reorder_history(cache, tab_id, remove) {
    var history = cache.history.filter(function (tmp_tab_id) {
      return tmp_tab_id !== tab_id;
    });
    if (remove === false) {
      history.push(tab_id);
    }
    cache.history = history;
  }

  function open_tab(cache, tab_id, view_id, class_id, object_id, options) {
    reorder_history(cache, tab_id, false);
    var entry = cache.entries[tab_id];
    if (is_null_or_undefined(entry)) {
      cache.entries[tab_id] = {
        "tab_id" : tab_id,
        "view_id" : view_id,
        "class_id" : class_id,
        "object_id" : object_id,
        "options" : options
      };
      cache.history.push(tab_id);
      cache.positions.push(tab_id);
    }
    return save_cache(cache);
  }

  function change_tab(cache, old_tab_id, new_tab_id, view_id, class_id, object_id, options) {
    reorder_history(cache, old_tab_id, false);
    delete cache.entries[old_tab_id];
    cache.entries[new_tab_id] = {
      "tab_id" : new_tab_id,
      "view_id" : view_id,
      "class_id" : class_id,
      "object_id" : object_id,
      "options" : options
    };
    cache.history.push(new_tab_id);
    var positions = cache.positions.map(function (tmp_tab_id) {
      return (tmp_tab_id === old_tab_id) ? new_tab_id : tmp_tab_id;
    });
    cache.positions = positions;
    return save_cache(cache);
  }

  function select_tab(cache, tab_id) {
    reorder_history(cache, tab_id, false);
    return save_cache(cache);
  }

  function remove_tab(cache, tab_id) {
    reorder_history(cache, tab_id, true);
    var entry = cache.entries[tab_id];
    if (!is_null_or_undefined(entry)) {
      delete cache.entries[tab_id];
    }
    var positions = cache.positions.filter(function (tmp_tab_id) {
      return tmp_tab_id !== tab_id;
    });
    cache.positions = positions;
    return save_cache(cache);
  }
  
  function Tabs () {
    this._root = null;
    this._tabs = null;
    this._idmap = {};
    this._body = null;
    this._contents = {};
    this._cache = null;
  }

  Tabs.prototype.add = function (view_id, class_id, object_id, options_) {
    var options = is_null_or_undefined(options_) ? {} : options_;
    var closable = is_null_or_undefined(options.closable) ? true : options.closable;
    var suffix = is_null_or_undefined(options.suffix) ? null : options.suffix;
    var count = arguments.length;
    this._body.children(".tab-panel").hide();
    var dfd = new $.Deferred;
    var self = this;
    var tab_id = create_tab_id(view_id, class_id, object_id, suffix);
    create_view(this, view_id, class_id, object_id, options)
    .then(function (view) {
      self._tabs.add({"id":tab_id, "caption":view.caption(), "closable": closable });
      return open_tab(self._cache, tab_id, view_id, class_id, object_id, options);
    }).then(function () {
      dfd.resolve(tab_id);
    });
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
    if (this._cache.history.length == 0) {
      return null;
    }
    var tab_id = this._cache.history[this._cache.history.length - 1];
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
    return select_tab(this._cache, tab_id);
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
    remove_tab(this._cache, tab_id);
    var length = this._cache.history.length; 
    var last_tab_id = this._cache.history[length - 1];
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
    var self = this;
    change_tab(this._cache, old_tab_id, new_tab_id, view_id, class_id, new_object_id, {})
    .done(function() {
      var panel = self._body.find("#" + old_tab_id);
      panel.attr("id", new_tab_id);
    });
  };

  function restore_tabs(self, positions, cache) {
    var dfd = new $.Deferred;
    if (positions.length === 0) {
      dfd.resolve();
      return dfd.promise();
    }
    var tab_id = positions.shift();
    var tab = cache.entries[tab_id];
    self.add(tab.view_id, tab.class_id, tab.object_id, tab.options)
    .then(function() {
      self.refresh(tab.view_id, tab.class_id, tab.object_id);
      return restore_tabs(self, positions, cache);
    }).then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  }

  Tabs.prototype.restore = function () {
    var self = this;
    var dfd = new $.Deferred;
    var original = null;
    Storage.personal("tabs")
    .done(function (cache) {
      original = Utils.clone(cache);
      return restore_tabs(self, cache.positions, cache);
    }).then(function () {
      return save_cache(original); // Restore tabs cache
    }).then(function () {
      var length = self._cache.history.length;
      var last_tab_id = self._cache.history[length - 1];
      var last_tab = self._cache.entries[last_tab_id];
      self.select(last_tab.view_id, last_tab.class_id, last_tab.object_id);
    }).then(function () {
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  Tabs.prototype.init = function (selector) {
    var self = this;
    Storage.personal("tabs")
    .then(function (cache) {
      self._cache = cache;
      return init_tabs(self);
    }).then(function () {
      self._root = $(selector);
      self._root.append(FRAME_TEMPLATE);

      var header_id = Uuid.version4();
      var header = self._root.find('.tabs-header');
      header.attr("id", header_id);

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
      self._tabs = w2ui[tabs_name];

      self._body = self._root.find('.tabs-body');
    });
  };
  
  Tabs.prototype.refresh = function (view_id, class_id, object_id) {
    if (arguments.length == 0) {
      this._tabs.refresh();
      return;
    }
    
    var tab_id = create_tab_id(view_id, class_id, object_id);
    this._tabs.refresh(tab_id);
  };

  Tabs.regist_tab = function (cache, view_id, class_id, object_id, options) {
    var tab_id = create_tab_id(view_id, class_id, object_id);
    return open_tab(cache, tab_id, view_id, class_id, object_id, options);
  };
  
  return Tabs;
});
