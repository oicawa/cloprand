define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Detail = require("controls/Detail/Detail");
  var Grid = require("controls/Grid/Grid");
  var Tabs = require("controls/Tabs/Tabs");

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

  function create_tab_id(prefix, class_id, object_id) {
    return prefix + "_" + class_id + (object_id ? "_" + object_id : "");
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
    var object_id = 2 < ids.length ? ids[2] : null;
    return {
      tab_id : tab_id,
      prefix : prefix,
      class_id : class_id,
      object_id : object_id
    };
  };

  Contents.tab_id = function (prefix, class_id, object_id) {
    return create_tab_id(prefix, class_id, object_id);
  };
  
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
  
  Contents.prototype.show_tab = function (view_name, class_id, object_id, label, options) {
    console.assert(typeof view_name == "string" && 1 <= view_name.length);
    console.assert(Utils.UUID.test(class_id));
    console.assert(object_id == null || Utils.UUID.test(object_id));
    var tab_id = create_tab_id(view_name, class_id, object_id);
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

  Contents.prototype.broadcast = function (class_id, object_id, data) {
    // *TODO*
    // Maybe, we have to broadcast these arguments information to all 'tab's,
    // and it leaves the determination of whether to be refreshed on the tab.
    // But now, implement easy...
    if (class_id == Utils.CLASS_UUID) {
      var menu_id = create_tab_id("MenuView", class_id, null);
      var menuview = this._tabs.content(menu_id);
      menuview.update(class_id, object_id, data);
    }

    var grid_id = create_tab_id("GridView", class_id, null);
    var gridview = this._tabs.content(grid_id);
    gridview.update(class_id, object_id, data);
  }
  
  Contents.prototype.init = function (selector) {
    var contents = $(selector);
    var classes = null;
    var template = null;
    var assist = null;
    var self = this;
    Utils.add_css("/defaults/style.css");
    $.when(
      Utils.get_file(null, "Contents.html", "html", function (data) { template = $.templates(data); }),
      Utils.get_file(null, "Contents.json", "json", function (data) { assist = data; })
    ).always(function() {
      var contents_html = template.render();
      contents.append(contents_html);
      
      // Tabs
      self._tabs = new Tabs();
      self._tabs.init("#contents-tabs");
      for (var i = 0; i < assist.tabs.length; i++) {
        var tab = assist.tabs[i];
        var tab_id = create_tab_id(tab.view, tab.class_id, tab.object_id);
        var selector = create_content_selector(tab_id);
        self._tabs.add(tab_id, tab.label, true, false);
        create_view(self, tab_id, selector, tab.view, tab.class_id, tab.object_id);
      }
    });
  };
  Contents.prototype.init2 = function () {
    $('#root-panel').css({width: '100%', height: '100%'}).split({orientation: 'horizontal', limit: 20, position: '45px', invisible: true, fixed: true});
    var classes = null;
    var template = null;
    var assist = null;
    Utils.add_css("/style.css");
    $.when(
      Utils.get_file(class_id, "crud.html", "html", function (data) { template = $.templates(data); }),
      Utils.get_file(class_id, "crud.json", "json", function (data) { assist = data; }),
      Utils.get_data(class_id, function (data) { classes = data; }),
      Utils.get_file("ae727055-cb09-49ed-84af-6cbc8cd37ba8", class_id + ".json", "json", function (data) { def_class = data; }),
      Utils.get_file(class_id, "assist.json", "json", function (data) { assist_class = data; })
    ).always(function() {
      document.title = document.title + " - " + def_class.label;
      var application_html = template.render();
      $("#contents-panel").append(application_html);
      var application = $("#application-panel");
      application.split({orientation: 'vertical', limit: 20, position: '300px'});
      
      // Grid
      _grid = new Grid();
      _grid.init("#object-list", null, assist)
      .then(function () {
        _grid.data(classes);
      });
      
      // Tabs
      _tabs = new Tabs("#object-detail-tabs");
      _tabs.init();
    });
  };
  
  return Contents;
});
