define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("data/Core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Detail = require("controls/Detail/Detail");
  var Grid = require("controls/Grid/Grid");
  var Tabs = require("controls/Tabs/Tabs");

  var TEMPLATE = `
<div id="contents-frame">
  <div id="contents-tabs">
    <ul>
    </ul>
  </div>
</div>
`;

  function show_tab(tab_id, label) {
    var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
    var id = "object-new-" + (new Date()).getTime();
    var li = $(tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
    var tabs = $("#object-detail-tabs");
    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
    tabs.tabs("refresh");
  }

  function show_tab2(tabs, tab_id, label) {
    var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
    var id = "object-new-" + (new Date()).getTime();
    var li = $(tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
    tabs.tabs("refresh");
  }
  
  function create_content_selector(tab_id) {
    return "#" + tab_id + " > div.tab-content-frame > div.tab-content-panel";
  }
  
  function create_view(self, tab_id, selector, view_name, class_id, object_id, options) {
    //var dfd = new $.Deferred;
    var view_path = "controls/views/" + view_name + "/" + view_name;
    require([view_path], function(View) {
      var view = new View();
      self._tabs.content(tab_id, view);
      try {
        view.init(selector, class_id, object_id, options);
        //.then(function() {
        //  dfd.resolve();
        //});
      } catch (e) {
        console.log("e=" + e + ", view_name=" + view_name + ", class_id=" + class_id + ", object_id=" + object_id);
      }
    });
    //return dfd.promise();
  }
  
  // Constructor
  function Contents() {
    this._tabs = null;
    this._assist = null;
  };
  
  Contents.get_tab_info = function (event) {
    // Get event source information
    var tab = $(event.target).closest("div.tab-panel");
    var tab_id = tab.prop("id");
    var ids = tab_id.split("_");
    var prefix = 0 < ids.length ? ids[0] : null;
    var class_id = 1 < ids.length ? ids[1] : null;
    var object_id = 2 < ids.length ? ids[2].replace(/-/g, "/") : null;
    return {
      tab_id : tab_id,
      prefix : prefix,
      class_id : class_id,
      object_id : object_id
    };
  };

//  Contents.tab_id = function (prefix, class_id, object_id) {
//    return Tabs.create_tab_id(prefix, class_id, object_id);
//  };
  
  Contents.prototype.add = function () {
    var label = "New " + def_class.label;
    var tab_id = "object-" + (new Date()).getTime();
    this._tabs.add(tab_id, label, true);

    var detail = new Detail();
    detail.init("#" + tab_id + " > div.tab-contents-panel > div.object_detail", def_class, assist_class, "name")
    .then(function() {
      detail.edit(true);
      detail.visible(true);
    });
    this._tabs.content(tab_id, detail);
  };
  
  Contents.prototype.show_tab = function (label, options, view_name, class_id, object_id) {
    console.assert(typeof view_name == "string" && 1 <= view_name.length);
    var params = Array.prototype.slice.call(arguments, 2);
    console.log(params);
    var tab_id = Tabs.create_tab_id(params);
    var exists = this._tabs.show(tab_id);
    if (exists) {
      return;
    }
    this._tabs.add(tab_id, label, true, true);

    var selector = create_content_selector(tab_id);
    create_view(this, tab_id, selector, view_name, class_id, object_id, options);
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
    Utils.add_css("/data/Core/Contents.css");
    $.when(
      Utils.get_file(null, "data/Core/Contents.json", "json", function (data) { assist = data; })
    ).always(function() {
      contents.append(TEMPLATE);
      
      // Tabs
      self._tabs = new Tabs();
      self._tabs.init("#contents-tabs");
      for (var i = 0; i < assist.tabs.length; i++) {
        var tab = assist.tabs[i];
        var tab_id = Tabs.create_tab_id(tab.id);
        var selector = create_content_selector(tab_id);
        self._tabs.add(tab_id, tab.label, true, false);
        create_view(self, tab_id, selector, tab.view, tab.class_id, tab.object_id);
      }
    });
  };
  
  return Contents;
});
