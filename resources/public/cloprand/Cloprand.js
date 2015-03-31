define(function (require) {
  require("jquery");
  require("json2");
  require("jquery_ui");
  require("jquery_splitter");
  var Utils = require("Utils");
  var Toolbar = require("Controls/Toolbar/Toolbar");
  var Grid = require("Controls/Grid/Grid");
  var Detail = require("Controls/Detail/Detail");
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

    function show_detail(is_object) {
      $("#object_detail").css("display", is_object ? "block" : "none");
      $("#class_detail").css("display", is_object ? "none" : "block");
    }

    function show_field_editor(visible) {
      var editor = $("#field_editor");
      editor.css("display", visible ? "block" : "none");
      editor.find("textarea, :text, select").val("").end().find(":checked").prop("checked", false);
      $("#field_description").val("Object UUID. This is generated automaticaly.");
    }

    function refresh_fields_table() {
    	
    }

    function add_new_object() {
      var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
      var label = "New Object";
      var id = "object-new-" + (new Date()).getTime();
      var li = $(tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
      _tabs.find(".ui-tabs-nav").append(li);
      _tabs.append("<div id='" + id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
      //_tabs.tabs("refresh");

      var def_field = null;
      var def_class = null;
      var assist_class = null;
      $.when(
        Utils.get_data("def_class.json", function (data) { def_class = data; }),
        Utils.get_data("def_field.json", function (data) { def_field = data; }),
        Utils.get_data("assist_class.json", function (data) { assist_class = data; })
      ).always(function() {
        //_list = new List();
        //_list.init("object_field_list", _def_field);
        //_list.act("add", add_item);
        //_list.act("edit", edit_item);
        //_list.columns([
        //  {"name":"name", "label": "Name", "renderer": null},
        //  {"name":"label", "label": "Label", "renderer": null},
        //  {"name":"description", "label": "Description", "renderer": null},
        //]);
        //_list.refresh();
        _detail = new Detail();
        _detail.init("#" + id + " > div.tab-contents-panel > div.object_detail", def_class, assist_class);
        _detail.visible(true);

        _tabs.tabs("refresh");

        // Activate the created new tab
        var index = _tabs.find("ul > li[aria-controls='" + id + "']").index();
        _tabs.tabs({ active : index});
      });
    }

    function add_item() {
      _detail.visible(true);
      _detail.ok_func(function(item) {
        _list.add_item(item);
        _detail.visible(false);
      });
    }

    function edit_item() {
      var item = _list.selected_item();
      _detail.data(item);
      _detail.visible(true);
      _detail.ok_func(function(item) {
        _list.selected_item(item);
        _detail.visible(false);
      });
    }

    this.init = function() {
      // Layout
      $('#root-panel').css({width: '100%', height: '100%'}).split({orientation: 'horizontal', limit: 20, position: '45px', invisible: true, fixed: true});
      $('#main-panel').split({orientation: 'vertical', limit: 20, position: '300px'});
      _tabs = $("#object-detail-tabs")
      _tabs.tabs({active: 1});
      _tabs.on("click", "span.ui-icon-close", function() {
        var panelId = $(this).closest("li").remove().attr("aria-controls");
        $("#" + panelId ).remove();
        _tabs.tabs("refresh");
      });

      _class_item = $("#object-list").html();
      $("#object-list").empty();

      var operations = new Toolbar();
      operations.init("#object-operations", [
        { "name": "add",    "caption": "Add",    "description": "Add new class", "func": add_new_object },
        { "name": "delete", "caption": "Delete", "description": "Delete new class", "func": function() { alert("delete"); } },
      ]);
    };
  };
});
