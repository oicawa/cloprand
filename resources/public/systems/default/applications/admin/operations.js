define(function (require) {
  require("jquery");
  //require("json2");
  //require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("core/controls/Toolbar/Toolbar");
  //var Grid = require("core/controls/Grid/Grid");
  var Detail = require("core/controls/Detail/Detail");
  return {
  	"add_new_object" : function() {
      var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
      var label = "New Object";
      var id = "object-new-" + (new Date()).getTime();
      var li = $(tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
      var tabs = $("#object-detail-tabs");
      tabs.find(".ui-tabs-nav").append(li);
      tabs.append("<div id='" + id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
      //_tabs.tabs("refresh");

      var def_field = null;
      var def_class = null;
      var assist_class = null;
      $.when(
        Utils.get_data("/core/classes/Class/class_Class.json", function (data) { def_class = data; }),
        Utils.get_data("/core/classes/Class/assist_Class.json", function (data) { assist_class = data; }),
        Utils.get_data("/core/classes/Field/class_Field.json", function (data) { def_field = data; })
      ).always(function() {
        var detail = new Detail();
        detail.init("#" + id + " > div.tab-contents-panel > div.object_detail", def_class, assist_class);
        detail.visible(true);

        tabs.tabs("refresh");

        // Activate the created new tab
        var index = tabs.find("ul > li[aria-controls='" + id + "']").index();
        tabs.tabs({ active : index});
      });
  	},
  	"delete_object" : function() {
  	  alert("clicked delete button!!");
  	},
    "init" : function() {
      // Layout
      $('#application-panel').split({orientation: 'vertical', limit: 20, position: '300px'});

      function create_application_panel() {
        var system_name = Utils.get_system_name();
        var application_name = Utils.get_application_name();
        var template = null;
        var config = null;
        var buf = [];
        buf.push("systems", system_name, "applications", application_name, "/operations");
        var application_operations_path = buf.join("/");
      	
        var tabs = $("#object-detail-tabs")
        tabs.tabs({active: 1});
        tabs.on("click", "span.ui-icon-close", function() {
          var panelId = $(this).closest("li").remove().attr("aria-controls");
          $("#" + panelId ).remove();
          tabs.tabs("refresh");
        });

        var operations = new Toolbar();
        operations.init("#object-operations", {
          "operations" : application_operations_path,
          "items" : [
            { "name": "add",    "caption": "Add",    "description": "Add new class", "operation": "add_new_object" },
            { "name": "delete", "caption": "Delete", "description": "Delete new class", "operation": "delete_object" },
          ]
        });
      };

      create_application_panel();
      
      //$.when(
      //  Utils.get_data(application_path + "/template.html", function (data) { template = $.templates(data); }),
      //  Utils.get_data(application_path + "/config.json", function (data) { config = data; })
      //).always(function() {
      //  var application_html = template.render(config);
      //  $("#contents-panel").append(application_html);
      //});
    }
  };
});
