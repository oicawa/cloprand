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

  var tabs = Storage.personal("tabs");
  function init_tabs() {
    var MENU_VIEW_ID = "676138ed-aee1-4d6d-a8d8-c114042b1833";	
    var MENU_TAB_ID = MENU_VIEW_ID + "_" + Class.CLASS_ID;
    var MENU_ENTRY = {
      "view_id" : MENU_VIEW_ID,
      "class_id" : Class.CLASS_ID,
       "object_id" : null,
      "options"  : { "closable" : false }
    };
    if (is_null_or_undefined(tabs)) {
      tabs = { "entries" : { MENU_TAB_ID : MENU_ENTRY }, "positions" : [MENU_TAB_ID], "history" : [MENU_TAB_ID] };
    }
    if (is_null_or_undefined(tabs["entries"])) {
      tabs["entries"] = { MENU_TAB_ID : MENU_ENTRY };
    }
    if (is_null_or_undefined(tabs["positions"])) {
      tabs["positions"] = [MENU_TAB_ID];
    }
    if (is_null_or_undefined(tabs["history"])) {
      tabs["history"] = [MENU_TAB_ID];
    }
    Storage.personal("tabs", tabs);
  }

  function reorder_history(tab_id, remove) {
    var history = tabs.history.filter(function (tmp_tab_id) {
      return tmp_tab_id !== tab_id;
    });
    if (remove === false) {
      history.push(tab_id);
    }
    tabs.history = history;
  }

  function open_tab(tab_id, view_id, class_id, object_id, options) {
    reorder_history(tab_id, false);
    var entry = tabs.entries[tab_id];
    if (is_null_or_undefined(entry)) {
      tabs.entries[tab_id] = {
        "tab_id" : tab_id,
        "view_id" : view_id,
        "class_id" : class_id,
        "object_id" : object_id,
        "options" : options
      };
      tabs.history.push(tab_id);
      tabs.positions.push(tab_id);
    }
    Storage.personal("tabs", tabs);
  }

  function change_tab(old_tab_id, new_tab_id, view_id, class_id, object_id, options) {
    reorder_history(old_tab_id, false);
    delete tabs.entries[old_tab_id];
    tabs.entries[new_tab_id] = {
      "tab_id" : new_tab_id,
      "view_id" : view_id,
      "class_id" : class_id,
      "object_id" : object_id,
      "options" : options
    };
    tabs.history.push(new_tab_id);
    var positions = tabs.positions.map(function (tmp_tab_id) {
      return (tmp_tab_id === old_tab_id) ? new_tab_id : tmp_tab_id;
    });
    tabs.positions = positions;
    Storage.personal("tabs", tabs);
  }

  function select_tab(tab_id) {
    reorder_history(tab_id, false);
    Storage.personal("tabs", tabs);
  }

  function remove_tab(tab_id) {
    reorder_history(tab_id, true);
    var entry = tabs.entries[tab_id];
    if (!is_null_or_undefined(entry)) {
      delete tabs.entries[tab_id];
    }
    var positions = tabs.positions.filter(function (tmp_tab_id) {
      return tmp_tab_id !== tab_id;
    });
    tabs.positions = positions;
    Storage.personal("tabs", tabs);
  }
  
  function Tabs () {
    this._root = null;
    this._tabs = null;
    this._idmap = {};
    this._body = null;
    this._contents = {};
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
      open_tab(tab_id, view_id, class_id, object_id, options);
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
    var tabs = Storage.personal("tabs");
    var count = tabs.history.length;
    if (count == 0) {
      return null;
    }
    var tab_id = tabs.history[count - 1];
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
    select_tab(tab_id);
    this._body.find("#" + tab_id).show();
    var view = this._contents[tab_id];
    if (view) {
      view.refresh();
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
    remove_tab(tab_id);

    var tabs = Storage.personal("tabs");
    var count = tabs.history.length;
    var last_tab_id = tabs.history[count - 1];
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
    change_tab(old_tab_id, new_tab_id, view_id, class_id, new_object_id, {});
    var panel = this._body.find("#" + old_tab_id);
    panel.attr("id", new_tab_id);
  };
  
  Tabs.prototype.init = function (selector) {
    init_tabs();
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
  };

  Tabs.regist = function (view_id, class_id, object_id, options) {
    var tab_id = create_tab_id(view_id, class_id, object_id);
    open_tab(tab_id, view_id, class_id, object_id, options);
  }
  
  return Tabs;
});
