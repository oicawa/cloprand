define(function (require) {
  require("jquery");
  require("json2");
  require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("core/controls/Toolbar/Toolbar");
  var Grid = require("core/controls/Grid/Grid");
  var Detail = require("core/controls/Detail/Detail");
  return function () {
    //var _baseUrl = Utils.getBaseUrl();
    var _tabs = null;
    var _class_item = null;
    var _object_item = null;
    var _fields = [];
    var _list = null;
    var _detail = null;
    var _def_field = null;
    var _def_class = null;

    //function show_detail(is_object) {
    //  $("#object_detail").css("display", is_object ? "block" : "none");
    //  $("#class_detail").css("display", is_object ? "none" : "block");
    //}

    //function show_field_editor(visible) {
    //  var editor = $("#field_editor");
    //  editor.css("display", visible ? "block" : "none");
    //  editor.find("textarea, :text, select").val("").end().find(":checked").prop("checked", false);
    //  $("#field_description").val("Object UUID. This is generated automaticaly.");
    //}

    //function refresh_fields_table() {
    //	
    //}

    this.init = function() {
      var system_name = Utils.get_system_name();
      system_name = system_name ? system_name : "";
      var template = null;
      var config = null;
      $.when(
        //Utils.get_data("/" + system_path + "/template.html", function (data) { template = $.templates(data); }),
        //Utils.get_data("/" + system_path + "/config.json", function (data) { config = data; })
        Utils.get_template(system_name, "", function (data) { template = $.templates(data); }),
        Utils.get_json("config", system_name, "", function (data) { config = data; })
      ).always(function() {
        var root_html = template.render(config);
        $("body").append(root_html);
        
        var js_require_path = "";
        if (0 < system_name.length) {
          js_require_path += system_name + "/";
        }
        js_require_path += "operations";
        alert(js_require_path);
        require([js_require_path], function(operations) {
          operations["init"]();
        });
      });
    };
  };
});
