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
    
    function create_control(selector /*, field*/) {
      var dfd = new $.Deferred;
      var html = _template.render(_assist);
      _root.append(html);
      _toolbar = new Toolbar(_instance);
      _toolbar.init(selector + " > div.grid > div.toolbar", _assist.toolbar);

      _table = $(selector + " > div.grid > table.grid");
      require([_assist.row.operations], function(operations) {
        _table.on("click", "tbody > tr", function(event) {
          _table.find("tr.selected").removeClass("selected");
          $(this).addClass("selected");
          var event_name = _assist.row.events["click"];
          operations[event_name](event, this);
        });

        _table.on("dblclick", "tbody > tr", function(event) {
          var event_name = _assist.row.events["dblclick"];
          operations[event_name](event, this);
        });
        dfd.resolve();
      });
      
      return dfd.promise();
    }

    this.init = function(selector, type, assist) {
      var dfd = new $.Deferred;
      Utils.add_css("/controls/Grid/Grid.css");
      
      // Set member fields
      _root = $(selector);
      _type = type;
      _assist = assist;

      _root.datatype = type;

      // Load template data & Create form tags
      Utils.get_control_template("Grid", function(response) { _template = $.templates(response); })
      .then(function() {
        return create_control(selector);
      }).then(function() {
        dfd.resolve();
      });
      return dfd.promise();
    };

    function refresh () {
      var thead = _table.find("thead");
      thead.empty();
      var thead_buf = [];
      thead_buf.push("<tr>");
      for (var i = 0; i < _assist.columns.length; i++) {
        var column = _assist.columns[i];
        thead_buf.push("<th>", column.label, "</th>");
      }
      thead_buf.push("</tr>");
      $(thead_buf.join("")).appendTo(thead);
      if (_assist.header.visible) {
        thead.show();
      } else {
        thead.hide();
      }
      
      var tbody = _table.find("tbody");
      tbody.empty();
      for (var i = 0; i < _data.length; i++) {
        var item = _data[i];
        var buf = [];
        buf.push("<tr>");
        for (var j = 0; j < _assist.columns.length; j++) {
          var column = _assist.columns[j];
          buf.push("<td>", item[column.name], "</td>");
        }
        buf.push("</tr>");
        $(buf.join("")).appendTo(tbody);
      }
    }

    function add_row() {
      var buf = [];
      buf.push("<tr>");
      for (var i = 0; i < _assist.columns.length; i++) {
        var column = _assist.columns[i];
        buf.push("<td class='", column.name, "'></td>");
      }
      buf.push("</tr>");
      var tbody = _table.find("tbody");
      var tr = $(buf.join(""));
      tr.appendTo(tbody);
      return tr;
    }

    function assign_item(tr, item) {
      for (var i = 0; i < _assist.columns.length; i++) {
        var column = _assist.columns[i];
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

    this.edit = function(on) {
      _toolbar.visible(on);
    };

    this.backuped = function() {
    };

    this.commit = function() {
    };

    this.restore = function() {
    };

    this.data = function(value) {
      if (arguments.length == 0) {
        return _data
      } else {
        _data = value;
        refresh();
      }
    };
  };
});
