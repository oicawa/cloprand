define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Detail = require("controls/Detail/Detail");
  var Grid = require("controls/Grid/Grid");
  var Tabs = require("controls/Tabs/Tabs");

  var _grid = null;
  var _tabs = null;
  var def_field = null;
  var def_class = null;
  var assist_class = null;

  function show_tab(tab_id, label) {
    var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
    var id = "object-new-" + (new Date()).getTime();
    var li = $(tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
    var tabs = $("#object-detail-tabs");
    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
    tabs.tabs("refresh");
    
  }
  
  return {
  	"add_new_system" : function () {
      var label = "New System";
      var tab_id = "system-" + (new Date()).getTime();
  	  _tabs.add(tab_id, label, true);

      var detail = new Detail();
      detail.init("#" + tab_id + " > div.tab-contents-panel > div.object_detail", def_class, assist_class, "name")
      .then(function() {
        detail.edit(true);
        detail.visible(true);
      });
      _tabs.content(tab_id, detail);
  	},
  	"show_detail" : function (event, row) {
  	  var selected_index = $(row).index();
  	  var system = _grid.data()[selected_index];
  	  var tab_id = "system-" + system.name;
  	  var exists = _tabs.show(tab_id);
  	  if (exists) {
  	    return;
  	  }
  	  _tabs.add(tab_id, system.label, true);
  	  
      var detail = new Detail();
      detail.init("#" + tab_id + " > div.tab-contents-panel > div.object_detail", def_class, assist_class, "name")
      .then(function() {
        detail.data(system);
        detail.edit(false);
        detail.visible(true);
      });
      _tabs.content(tab_id, detail);
  	},
  	"show_detail_tab" : function () {
  	  alert("Called show_detail_tab function.");
  	},
  	"tabs" : function() {
  	  return _tabs;
  	},
  	"list" : function() {
  	  return _grid;
  	},
    "init" : function() {
      $('#root-panel').css({width: '100%', height: '100%'}).split({orientation: 'horizontal', limit: 20, position: '45px', invisible: true, fixed: true});
      
      var systems = null;
      var template = null;
      var assist = null;
      Utils.add_css("/style.css");
      $.when(
        Utils.get_file("", "", "application.html", "html", function (data) { template = $.templates(data); }),
        Utils.get_file("", "", "assist.json", "json", function (data) { assist = data; }),
        Utils.get_data("", "", "systems", function (data) { systems = data; }),
        Utils.get_file("", "", "/classes/System/class.json", "json", function (data) { def_class = data; }),
        Utils.get_file("", "", "/classes/System/assist.json", "json", function (data) { assist_class = data; }),
        Utils.get_file("", "", "/classes/Field/class.json", "json", function (data) { def_field = data; })
      ).always(function() {
        var application_html = template.render();
        $("#contents-panel").append(application_html);
        var application = $("#application-panel");
        application.split({orientation: 'vertical', limit: 20, position: '300px'});

        // Grid
        _grid = new Grid();
        _grid.init("#object-list", null, assist)
        .then(function () {
          _grid.data(systems);
        });

        // Tabs
        _tabs = new Tabs("#object-detail-tabs");
        _tabs.init();
      });
    }
  };
});
