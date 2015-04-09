define(function (require) {
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  return function () {
    var _root = null;
    var _assist = null;
    var _type = null;
    var _template = null;
    var _data = null;
    var _toolbar = null;
    var _table = null;
    var _columns = [];
    var _items = [];
    var _instance = this;
    
    function create_control(selector, field) {
      var html = _template.render(_assist.settings);
      _root.append(html);
      _toolbar = new Toolbar();
      _toolbar.init(selector + " > div.grid > div.toolbar", _assist.settings.toolbar);

      _table = $(selector + " > div.grid > table.grid");
      _table.on("click", "tbody > tr", function(event) {
        _table.find("tr.selected").removeClass("selected");
        $(this).addClass("selected");
      });

      //_instance.act("delete", function() {
      //  var selected_tr = _table.find("tbody > tr.selected");
      //  var index = selected_tr.index();
      //  if (index < 0) {
      //    return;
      //  }
      //  selected_tr.remove();
      //  _items.splice(index, 1);
      //});
    }

    this.init = function(selector, field, assist) {
      Utils.add_css("/controls/Grid/Grid.css");
      
      // Set member fields
      _root = $(selector);
      _type = field.datatype;
      _assist = assist;

      // Load template data & Create form tags
      $.when(
        Utils.get_control_template("Grid", function(response) { _template = $.templates(response); }),
        Utils.get_file("", "", _assist.data, "json", function(response) { _data = response; })
      ).always(function() {
        create_control(selector, field);
      });
    };

    //this.act = function(action, func) {
    //  var actions = { "add": "ui-icon-plus", "delete": "ui-icon-minus", "edit": "ui-icon-pencil" };
    //  var li = _toolbar.find("li[title='." + actions[action] + "']");
    //  li.on("click", function (event) {
    //    event.preventDefault();
    //    func(event)
    //  });
    //};

    //this.columns = function(columns) {
    //  _columns = columns;
    //};

    //this.refresh = function() {
    //  var tr = _table.find("thead > tr");
    //  tr.empty();
    //  for (var i = 0; i < _assist.settings.columns.length; i++) {
    //    var column = _assist.settings.columns[i];
    //    var buf = [];
    //    //buf.push("<th class='", column.name, "'>", column.label, "</th>");
    //    buf.push("<th>", column.label, "</th>");
    //    $(buf.join("")).appendTo(tr);
    //  }
    //};

    function add_row() {
      var buf = [];
      buf.push("<tr>");
      for (var i = 0; i < _assist.settings.columns.length; i++) {
        var column = _assist.settings.columns[i];
        buf.push("<td class='", column.name, "'></td>");
      }
      buf.push("</tr>");
      var tbody = _table.find("tbody");
      var tr = $(buf.join(""));
      tr.appendTo(tbody);
      return tr;
    }

    function assign_item(tr, item) {
      for (var i = 0; i < _assist.settings.columns.length; i++) {
        var column = _assist.settings.columns[i];
        var value = column.renderer ? column.renderer(item) : item[column.name];
        tr.children("td." + column.name).text(value);
      }
    }

    this.add_item = function(item) {
      _items.push(item);
      var tr = add_row();
      assign_item(tr, item);
    };

    this.selected_item = function(item) {
      var selected_tr = _table.find("tbody > tr.selected");
      var index = selected_tr.index();
      if (index < 0) {
        return;
      }
      if (arguments.length == 0) {
        return _items[index];
      }
      _items.splice(index, 1, item);
      assign_item(selected_tr, item);
    };
  };
});
