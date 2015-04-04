define(function (require) {
  require("jquery");
  //require("json2");
  //require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  //var Toolbar = require("core/controls/Toolbar/Toolbar");
  //var Grid = require("core/controls/Grid/Grid");
  //var Detail = require("core/controls/Detail/Detail");
  return {
    "init" : function() {
      // Layout
      $('#root-panel').css({width: '100%', height: '100%'}).split({orientation: 'horizontal', limit: 20, position: '45px', invisible: true, fixed: true});
      //$('#main-panel').split({orientation: 'vertical', limit: 20, position: '300px'});

      var system_name = Utils.get_system_name();
      var application_name = Utils.get_application_name();
      
      //_tabs = $("#object-detail-tabs")
      //_tabs.tabs({active: 1});
      //_tabs.on("click", "span.ui-icon-close", function() {
      //  var panelId = $(this).closest("li").remove().attr("aria-controls");
      //  $("#" + panelId ).remove();
      //  _tabs.tabs("refresh");
      //});

      //_class_item = $("#object-list").html();
      //$("#object-list").empty();

      //var operations = new Toolbar();
      //operations.init("#object-operations", [
      //  { "name": "add",    "caption": "Add",    "description": "Add new class", "func": add_new_object },
      //  { "name": "delete", "caption": "Delete", "description": "Delete new class", "func": function() { alert("delete"); } },
      //]);

      var template = null;
      var config = null;
      var buf = [];
      buf.push("systems", system_name, "applications", application_name);
      var application_path = buf.join("/");
      $.when(
        Utils.get_data("/" + application_path + "/template.html", function (data) { template = $.templates(data); }),
        Utils.get_data("/" + application_path + "/config.json", function (data) { config = data; })
      ).always(function() {
        var application_html = template.render(config);
        $("#contents-panel").append(application_html);
        require([application_path + "/operations"], function(operations) {
          operations["init"]();
          Utils.add_css("/" + application_path + "/style.css?ver=" + (new Date()).getTime());
        });
      });
    }
  };
});
