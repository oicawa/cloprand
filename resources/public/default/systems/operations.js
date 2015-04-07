define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("core/controls/Toolbar/Toolbar");
  return {
  	"add_new_system" : function () {
  	  alert("called [add_new_system]");
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
        Utils.get_template("", "", "application", function (data) { template = $.templates(data); }),
        Utils.get_json("systems", "", "", function (data) { systems = data; })
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
