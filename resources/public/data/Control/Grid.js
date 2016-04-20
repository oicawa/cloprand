define(function (require) {
  require("jquery");
  require("w2ui");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  //var Toolbar = require("data/Control/Toolbar");
  
  var TEMPLATE = '<div class="grid"></div>';

  function create_control(self, template, style) {
    self._root.append(template);
    var grid = self._root.children("div.grid");
    var uuid = Uuid.version4();
    var name = uuid.replace(/-/g, "_");
    grid.w2grid({
      name:name,
      style:style,
      columns:self._columns
    });
    
    self._grid = w2ui[name];
    
    self._grid.on('click', function(event) {
      event.onComplete = function() {
        var operation = self._operations["click"];
        if (!operation) {
          return;
        }
        //event.target = self;
        operation(event);
      };
    });

    //regist_event(self, "click");
    //regist_event(self, "dblclick");
  }

  function assign_item(self, tr, item) {
    for (var i = 0; i < self._columns.length; i++) {
      var column = self._columns[i];
      var value = column.renderer ? column.renderer(item) : item[column.name];
      tr.children("td." + column.name).text(value);
    }
  }

  function Grid() {
    this._selector = null;
    this._root = null;
    this._data = [];
    this._table = null;
    this._columns = [];
    this._items = [];
    this._operations = {};
    this._grid = null;
  }

  Grid.create_columns = function (klass) {
    console.assert(typeof assist == "undefined", "assist not undefined.");
    if (!klass) {
      return null;
    }
    var columns = [{ field: 'recid', caption: 'RECID', size: '50px' }];
    var fields = klass.object_fields;
    if (!fields) {
      return columns;
    }
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (!field.column) {
        continue;
      }
      
      columns.push({field: field.name, caption: field.label, type: "text", size: "50px", resizable: true, sortable:true});
    }
    return columns;
  }

  Grid.prototype.init = function(selector, columns, style) {
    var dfd = new $.Deferred;
    this._selector = selector;
    this._root = $(selector);
    this._columns = columns;

    // CSS
    Utils.load_css("/data/Style/Grid.css");
    
    // Create form tags
    create_control(this, TEMPLATE, style);
    dfd.resolve();
    return dfd.promise();
  };

  Grid.prototype.add_operation = function(event_name, operation) {
    this._operations[event_name] = operation;
  };

  Grid.prototype.add = function(item) {
    this._data.push(item);
  };

  Grid.prototype.get = function(recid) {
    return this._grid.get(recid);
  };

  Grid.prototype.select = function() {
    var indexes = Array.prototype.slice.call(arguments);
    var recids = indexes.map(function(currentValue, index, array) { return currentValue + 1; });
    this._grid.select.apply(this._grid, recids);
  };
  
  Grid.prototype.selection = function() {
    return this._grid.getSelection().map(function(currentValue, index, array) {
      return currentValue - 1;
    });
  };

  Grid.prototype.delete = function(indexes) {
    indexes.sort().reverse().forEach(function(currentValue, index, array) {
      this._data.splice(currentValue, 1);
    }, this);
  };

  Grid.prototype.edit = function(on) {
  };

  Grid.prototype.backuped = function() {
  };

  Grid.prototype.commit = function() {
  };

  Grid.prototype.restore = function() {
  };

  Grid.prototype.columns = function(columns_) {
    this._columns = columns_;
  };

  Grid.prototype.header_visible = function(visible) {
    console.assert(false, "*NOT* Implemented.");
  };

  Grid.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._data
    } else {
      this._data = !value ? [] : value;
    }
  };
  
  Grid.prototype.refresh = function() {
    this._data.map(function(currentValue, index, array) {
      currentValue.recid = index + 1;
      return currentValue;
    }, null);
    this._grid.clear();
    this._grid.columns = this._columns;
    this._grid.records = this._data;
    this._grid.total = this._data.length;
    this._grid.refresh();
  };

  Grid.prototype.item = function(index, value) {
    if (arguments.length == 1) {
      return this._data[index];
    } else if (arguments.length == 2) {
      this._data[index] = value;
    } else {
      console.assert(false, "arguments = " + arguments);
    }
  };

  Grid.prototype.move = function(index, step) {
  	// index check
    if (index < 0 || step == 0 || index + step < 0) {
      return;
    }
    var max_index = this._data.length - 1;
    if (max_index <= 0 || max_index < index || max_index < index + step) {
      return;
    }

    var offset = step < 0 ? index + step : index;
    var count = Math.abs(step) + 1;
    var target = this._data[index];
    var start = step < 0 ? index + step : index + 1;
    var end = start + count - 1;
    var args = this._data.slice(start, end);
    if (step < 0) {
      args.splice(0, 0, offset, count, target);
    } else {
      args.splice(0, 0, offset, count);
      args.push(target);
    }
    Array.prototype.splice.apply(this._data, args);
  };

  Grid.prototype.update = function(object_id, item) {
    console.assert(object_id && Utils.UUID.test(object_id) && object_id != Utils.NULL_UUID, "object_id=" + object_id);
    if (!this._data) {
      this._data = [];
    }
    var exists = false;
    for (var i = 0; i < this._data.length; i++) {
      var tmp_item = this._data[i];
      if (tmp_item.id != object_id) {
        continue;
      }
      exists = true;
      if (!item) {
        this._data.splice(i, 1);	// remove
      } else {
        this._data[i] = item;		// update
      }
      return;
    }
    // create
    if (item) {
      this._data.push(item);
    }
  };

  return Grid;
});
