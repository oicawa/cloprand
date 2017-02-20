define(function (require) {
  require("jquery");
  require("w2ui");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Uuid = require("core/Uuid");
  var Storage = require("core/Storage");
  var Class = require("core/Class");

  var TEMPLATE = '<div class="grid"></div>';

  function create_control(self, columns, style) {
    self._root.append(TEMPLATE);
    var grid = self._root.children("div.grid");
    var uuid = Uuid.version4();
    var name = uuid.replace(/-/g, "_");
    grid.w2grid({
      name:name,
//      style:style,
      recid:'id',
      columns:columns,
      onDblClick:function(event) {
        var operation = self._operations["dblclick"];
        if (!operation) {
          return;
        }
        operation(event);
      }
    });
    
    self._grid = w2ui[name];
  }

  function Grid() {
    this._selector = null;
    this._root = null;
    this._operations = {};
    this._grid = null;
  }

  Grid.create_columns = function (class_) {
    var dfd = new $.Deferred
    var COLUMN_RECID = { field: 'recid', caption: 'ID', size: '50px' };
    if (!class_ || !class_.object_fields) {
      dfd.resolve([COLUMN_RECID])
      return dfd.promise();
    }
    var primitives = null;
    Storage.read(Class.PRIMITIVE_ID)
    .done(function (primitives) {
      var fields = class_.object_fields.filter(function(field) { return !field.column ? false : true;});
      var columns = [];
      var promises = fields.map(function(field, index) {
        // get a cell render of primitive, and assign it to column property
        var inner_dfd = new $.Deferred;
        var primitive = primitives[field.datatype.id];
        if (!primitive) {
          inner_dfd.resolve();
          return inner_dfd.promise();
        }

        require([primitive.require_path], function(Control) {
          var column = {
            field: field.name,
            caption: Locale.translate(field.label),
            type: "text",
            size: field.column + "px",
            resizable: true,
            sortable:true
          };
          
          if (!Control.cell_render) {
            column.render = function(record, row_index, column_index) { return record[field.name]; };
            columns[index] = column;
            inner_dfd.resolve();
            return;
          }
          
          Control.cell_render(field)
          .done(function(renderer) {
            column.render = renderer;
            columns[index] = column;
            inner_dfd.resolve();
          });
        });
        return inner_dfd.promise(); 
      });
      $.when.apply(null, promises)
      .then(function() {
        columns.push(COLUMN_RECID);
        dfd.resolve(columns);
      });
       
    });
    return dfd.promise();
  }

  Grid.prototype.init = function(selector, columns, options) {
    var dfd = new $.Deferred;
    this._selector = selector;

    var default_styles = { "width":null, "height":null };
    var styles = Utils.get_as_json(default_styles, function () { return options; });
    this._root = $(selector);
    if (styles.width != null || styles.height != null) {
      this._root.css("position", "relative");
      this._root.css("width",  styles.width  == null ? "100%" : "" + styles.width  + "px");
      this._root.css("height", styles.height == null ? "100%" : "" + styles.height + "px");
    }
    
    var self = this;

    // CSS
    Utils.load_css("/core/Control/Grid.css")
    .then(function() {
      // Create form tags
      create_control(self, columns);
      dfd.resolve();
    });
    
    return dfd.promise();
  };

  Grid.prototype.add_operation = function(event_name, operation) {
    this._operations[event_name] = operation;
  };

  Grid.prototype.add = function(item) {
    item.recid = item.id;
    this._grid.add(item);
  };

  Grid.prototype.get = function(recid, returnIndex) {
    var is_return_index = !returnIndex ? false : true;
    return this._grid.get(recid, is_return_index);
  };

  Grid.prototype.set = function(recid, item) {
    this._grid.set(recid, item);
  };

  Grid.prototype.select = function() {
    var recids = Array.prototype.slice.call(arguments);
    this._grid.select.apply(this._grid, recids);
  };
  
  Grid.prototype.selection = function() {
    return this._grid.getSelection();
  };

  Grid.prototype.unselect = function() {
    if (arguments.length == 0) {
      this._grid.selectNone();
      return;
    }
    var recids = Array.prototype.slice.call(arguments);
    this._grid.select.apply(this._grid, recids);
  };
  
  Grid.prototype.remove = function(recids) {
    var recids = Array.prototype.slice.call(arguments);
    this._grid.remove.apply(this._grid, recids);
  };

  Grid.prototype.edit = function(on) {
  };

  Grid.prototype.backuped = function() {
  };

  Grid.prototype.commit = function() {
  };

  Grid.prototype.restore = function() {
  };

  Grid.prototype.multi_search = function (value) {
    this._grid.multiSearch = value;
  };
  
  Grid.prototype.multi_select = function (value) {
    this._grid.multiSelect = value;
  };
  
  Grid.prototype.row_height = function (height) {
    this._grid.recordHeight = height;
  };
  
  Grid.prototype.fixed_body = function (value) {
    this._grid.fixedBody = value;
  };
  
  Grid.prototype.toolbar = function (value) {
    this._grid.show.toolbar = value;
  };

  Grid.prototype.select_column = function (value) {
    this._grid.show.selectColumn = value;
  };

  Grid.prototype.header_visible = function(visible) {
    console.assert(false, "*NOT* Implemented.");
  };

  Grid.prototype.actions = function(actions) {
    this._grid.toolbar.items = actions;
 };
  
  Grid.prototype.data = function(value) {
    // getter
    if (arguments.length == 0) {
      return this._grid.records;
    }
    // setter
    if (!value) {
      this._grid.records = [];
      return;
    }
    if (Utils.is_object(value)) {
      this._grid.records = Object.keys(value).map(function(id) { return value[id]; });
      return;
    }
    this._grid.records = value;
  };
  
  Grid.prototype.refresh = function(reorder) {
    if (typeof reorder === "function") {
      this._grid.records.forEach(reorder);
    }
    this._grid.refresh();
  };

  Grid.prototype.move = function(recid, step) {
    // index check
    var index = this._grid.get(recid, true);
    if (index < 0 || step == 0 || index + step < 0) {
      return;
    }
    var max_index = this._grid.records.length - 1;
    if (max_index <= 0 || max_index < index || max_index < index + step) {
      return;
    }

    var offset = step < 0 ? index + step : index;
    var count = Math.abs(step) + 1;
    var target = this._grid.records[index];
    var start = step < 0 ? index + step : index + 1;
    var end = start + count - 1;
    var args = this._grid.records.slice(start, end);
    if (step < 0) {
      args.splice(0, 0, offset, count, target);
    } else {
      args.splice(0, 0, offset, count);
      args.push(target);
    }
    Array.prototype.splice.apply(this._grid.records, args);
  };

  Grid.prototype.update = function(object_id, item) {
    console.asset(false);
  };

  return Grid;
});
