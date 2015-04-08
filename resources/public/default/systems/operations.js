define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("core/controls/Toolbar/Toolbar");
  var Detail = require("core/controls/Detail/Detail");
  return {
  	"add_new_system" : function () {
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
        Utils.get_file("", "", "/core/classes/System/class_System.json", "json", function (data) { def_class = data; }),
        Utils.get_file("", "", "/core/classes/System/assist_System.json", "json", function (data) { assist_class = data; }),
        Utils.get_file("", "", "/core/classes/Field/class_Field.json", "json", function (data) { def_field = data; })
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
  	"delete_system" : function () {
  	  alert("called [delete_system]");
  	},
    "init" : function() {
      $('#root-panel').css({width: '100%', height: '100%'}).split({orientation: 'horizontal', limit: 20, position: '45px', invisible: true, fixed: true});
      
      var systems = null;
      var template = null;
      Utils.add_css("/style.css");
      $.when(
        Utils.get_file("", "", "application.html", "html", function (data) { template = $.templates(data); }),
        Utils.get_data("", "", "systems", function (data) { systems = data; })
      ).always(function() {
        var application_html = template.render();
        $("#contents-panel").append(application_html);
        var application = $("#application-panel");
        application.split({orientation: 'vertical', limit: 20, position: '300px'});
        var list = $("#object-list");
        list.empty();
        var ul = $("<ul></ul>");
        list.append(ul);
        for (var i = 0; i < systems.length; i++) {
          ul.append("<li>" + systems[i] + "</li>");
        }
        
        var tabs = $("#object-detail-tabs");
        tabs.tabs({active: 1});
        tabs.on("click", "span.ui-icon-close", function() {
          var panelId = $(this).closest("li").remove().attr("aria-controls");
          $("#" + panelId ).remove();
          tabs.tabs("refresh");
        });
        
        var toolbar = new Toolbar();
        toolbar.init("#object-operations", {
          "operations" : "operations",
          "items" : [
            { "name": "add",    "caption": "Add",    "description": "Add new class", "operation": "add_new_system" },
            { "name": "delete", "caption": "Delete", "description": "Delete new class", "operation": "delete_system" },
          ]
        });
      });
    }
  };
});
