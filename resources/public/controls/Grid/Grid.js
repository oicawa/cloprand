define(function (require) {
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");

  function create_control(self, root, template) {
    var dfd = new $.Deferred;
    var html = template.render(self._assist);
    root.append(html);

    self._table = root.children("table.grid");
    require([self._assist.row.operations], function(operations) {
      self._table.on("click", "tbody > tr", function(event) {
        self._table.find("tr.selected").removeClass("selected");
        $(this).addClass("selected");
        var event_name = self._assist.row.events["click"];
        operations[event_name](event);
      });

      self._table.on("dblclick", "tbody > tr", function(event) {
        var event_name = self._assist.row.events["dblclick"];
        operations[event_name](event);
      });
      dfd.resolve();
    });

    return dfd.promise();
  }

  function refresh(self) {
    var thead = self._table.find("thead");
    thead.empty();
    var thead_buf = [];
    thead_buf.push("<tr>");
    for (var i = 0; i < self._assist.columns.length; i++) {
      var column = self._assist.columns[i];
      thead_buf.push("<th>", "<div>", column.label, "</div>", "</th>");
    }
    thead_buf.push("</tr>");
    $(thead_buf.join("")).appendTo(thead);
    if (self._assist.header.visible) {
      thead.show();
    } else {
      thead.hide();
    }

    var tbody = self._table.find("tbody");
    tbody.empty();
    if (!self._data) {
      return;
    }
    for (var i = 0; i < self._data.length; i++) {
      var item = self._data[i];
      var buf = [];
      buf.push("<tr>");
      for (var j = 0; j < self._assist.columns.length; j++) {
        var column = self._assist.columns[j];
        buf.push("<td>", "<div>", item[column.name], "</div>", "</td>");
      }
      buf.push("</tr>");
      $(buf.join("")).appendTo(tbody);
    }
  }

  function assign_item(self, tr, item) {
    for (var i = 0; i < self._assist.columns.length; i++) {
      var column = self._assist.columns[i];
      var value = column.renderer ? column.renderer(item) : item[column.name];
      tr.children("td." + column.name).text(value);
    }
  }

  function Grid() {
    this._root = null;
    this._assist = null;
    this._class = null;
    this._template = null;
    this._data = [];
    this._table = null;
    this._columns = [];
    this._items = [];
  }

  Grid.prototype.init = function(selector, klass, assist) {
    var dfd = new $.Deferred;

    this._class = klass;
    this._assist = assist;
    var root = $(selector);
    var template = null;
    var self = this;

    // CSS
    Utils.add_css("/controls/Grid/Grid.css");
    
    // Load template data & Create form tags
    Utils.get_template("controls", "Grid", function(response) { template = $.templates(response); })
    .then(function() {
      return create_control(self, root, template);
    }).then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  };

  Grid.prototype.add_item = function(item) {
    this._data.push(item);
    refresh(this);
  };

  Grid.prototype.selected_item = function(item) {
    var selected_tr = this._table.find("tbody > tr.selected");
    var index = selected_tr.index();
    if (index < 0) {
      return;
    }
    if (arguments.length == 0) {
      return this._items[index];
    }
    this._items.splice(index, 1, item);
    assign_item(this, selected_tr, item);
  };

  Grid.prototype.selected_index = function(item) {
    var selected_tr = this._table.find("tbody > tr.selected");
    var index = selected_tr.index();
    return index;
  };

  Grid.prototype.delete = function(index) {
    this._data.splice(index, 1);
    refresh(this);
  };

  Grid.prototype.edit = function(on) {
  };

  Grid.prototype.backuped = function() {
  };

  Grid.prototype.commit = function() {
  };

  Grid.prototype.restore = function() {
  };

  Grid.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._data
    } else {
      this._data = value;
      refresh(this);
    }
  };

  Grid.prototype.item = function(index, value) {
    if (arguments.length == 1) {
      return this._data[index];
    } else if (arguments.length == 2) {
      this._data[index] = value;
      refresh(this);
    } else {
      console.assert(false, "arguments = " + arguments);
    }
  };

  Grid.prototype.update = function(object_id, item) {
    console.assert(object_id && Utils.UUID.test(object_id) && object_id != Utils.NULL_UUID, "object_id=" + object_id);
    if (!this._data) {
      this._data = [];
    }
    var exists = false;
    for (var i = 0; i < this._data.length; i++) {
      var tmp_item = this._data[i];
      if (tmp_item.uuid != object_id) {
        continue;
      }
      exists = true;
      if (!item) {
        this._data.splice(i, 1);	// remove
      } else {
        this._data[i] = item;		// update
      }
      refresh(this);
      return;
    }
    // create
    if (item) {
      this._data.push(item);
      refresh(this);
    }
  };

  return Grid;
});
