define(function (require) {
  require("jquery");
  require("w2ui");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Uuid = require("core/Uuid");
  var Storage = require("core/Storage");
  var Class = require("core/Class");
  var Primitive = require("core/Primitive");
  var Menu = require("core/Control/Menu");

  var TEMPLATE = '<div class="grid"></div>';

  function direction(direction_id) {
  	var ASC = "607ce339-8517-4271-8ba6-f4dd35a2b940";
    var DSC = "5d15314e-4952-4310-b410-4dd8a388177e";
    if (direction_id == ASC) {
      return "asc";
    }
    if (direction_id == DSC) {
      return "desc";
    }
    return null;
  }

  function create_control(self) {
    self._root.append(TEMPLATE);
    var grid = self._root.children("div.grid");
    var uuid = Uuid.version4();
    var name = uuid.replace(/-/g, "_");
    grid.w2grid({
      name:name,
      recid:'id',
      show: {
        toolbar:true,
        toolbarReload:false,
        //toolbarColumns:false,
        toolbarColumns:true,
        //toolbarSearch:false,
        toolbarSearch:true,
        //toolbarInput:false,
        toolbarInput:true,
      },
      columns: self._columns,
      onDblClick:function(event) {
        //console.log(event);
        if (!self._grid.menu || (!Array.isArray(self._grid.menu)) || (self._grid.menu.length == 0)) {
          if (!self.double_click) {
            return;
          }
          self.double_click(event);
          return;
        }
        
        var item = self._grid.menu[0];
        if (!item) {
          return;
        }
        event.item = item;
        item.action(event);
      },
      onToolbar : function (event) {
        var item = this.toolbar.get(event.target);
        if (!item.action) {
          return;
        }
        event.item = item;
        item.action(event);
      },
      onMenuClick : function (event) {
        if (!self._grid.menu || (!Array.isArray(self._grid.menu)) || (self._grid.menu.length == 0)) {
          return;
        }
        event.item = event.menuItem;
        event.item.action(event);
      },
      //onColumnClick : function (event) {
      onSort : function (event) {
        event.preventDefault();

        var name = event.field;;

        if (!self._field_map) {
          return;
        }
        var value = self._field_map[name];
        if (!value) {
          return;
        }
        var compare = value.compare;
        if (!compare) {
          return;
        }

        var columns = this.columns.filter(function (column) { return column.field == event.field; });
        if (!columns || columns.length == 0) {
          return;
        }
        var column = columns[0];

        var direction = 0;
        if (column.direction == "asc") {
          column.direction = "desc";
          direction = -1;
        } else if (column.direction == "desc") {
          column.direction = "asc";
          direction = 1;
        } else {
          column.direction = "asc";
          direction = 1;
        }

        function compare_with_direction(record0, record1) {
          return compare(record0, record1) * direction;
        }

        this.records.sort(compare_with_direction);
        this.refresh();
      }
    });
    
    self._grid = w2ui[name];
  }

  function Grid() {
    this._selector = null;
    this._root = null;
    this._grid = null;
    this._comparers = null;
  }

  Grid.columns = function (class_, field_map) {
    // ID column
    var COLUMN_RECID = { field: 'recid', caption: 'ID', size: '100px', hidden:false };
    if (!class_ || !class_.object_fields) {
      return [COLUMN_RECID];
    }

	// All field columns
    var columns = class_.object_fields.map(function(field) {
      // Calculate column width
      var width = parseInt(field.column, 10);
      var is_hidden = isNaN(width) ? true : false;
      width = isNaN(width) ? 100 : width;
      
      // Create column parameters
      var column = {
        field: field.name,
        caption: Locale.translate(field.label),
        type: "text",
        size: width + "px",
        hidden: is_hidden,
        resizable: true,
        sortable:true,
      };

      // set render
      if (!field_map)
        debugger;
      var value = field_map[field.name];
      column.render = value.render;

      // set direction
      column.direction = direction(value.field.sort_direction);
     
      return column;
    });
    columns.push(COLUMN_RECID);

    return columns;
  }
  
  Grid.queries = function (fields, src_queries) {
    var dfd = new $.Deferred
    var COLUMN_RECID = { field: 'recid', caption: 'ID', size: '50px' };
    var DEFAULT_QUERY = { label: null, columns:COLUMN_RECID, order:null, condition: null };
    if (!fields || !src_queries) {
      dfd.resolve([DEFAULT_QUERY])
      return dfd.promise();
    }

    function filter_generator(condition) {
      var dfd = new $.Deferred;
      var filter = function (record) {
        return true;
      };
      dfd.resolve(filter);
      return dfd.promise();
    }

    function sorter_generator(orders) {
      var dfd = new $.Deferred;
      var sorter = function (record0, record1) {
        return 0;
      };
      dfd.resolve(sorter);
      return dfd.promise();
    }

    function column_converter(src_column, field, control) {
      var dfd = new $.Deferred;
      var dst_column = {
        field: field.name,
        caption: Locale.translate(field.label),
        type: "text",
        size: field.column + "px",
        resizable: true,
        sortable:true
      };

      if (!control.renderer) {
        dfd.resolve(dst_column);
        return dfd.promise();
      }

      control.renderer(field)
      .done(function(renderer) {
        dst_column.render = renderer;
        dfd.resolve(dst_column);
      });
      return dfd.promise();
    }

    function columns_converter(src_columns, field_map, controls) {
      var dfd = new $.Deferred;
      var columns = [];
      var promises = [];
      src_columns.forEach(function(src_column) {
        var field = field_map[src_column.field.field_name]
        var control = controls[field.datatype.id];
        var promise = column_converter(src_column, field, control)
                      .done(function (column) { columns.push(column); });
        promises.push(promise);
      });
      
      $.when.apply(null, promises)
      .then(function () {
        return dfd.resolve(columns);
      });
      return dfd.promise();
    }
    
    function query_converter(src_query, fields, controls) {
      var dfd = new $.Deferred;

      var field_map = {};
      fields.forEach(function (field) {
        field_map[field.name] = field;
      });

      var query = {}
      columns_converter(src_query.columns, field_map, controls)
      .then(function(columns) {
        query.columns = columns;
        return sorter_generator(src_query.orders);
      })
      .then(function(sorter) {
        query.sorter = sorter;
        return filter_generator(src_query.filter);
      })
      .then(function(filter) {
        query.filter = filter;
        dfd.resolve(query);
      });

      return dfd.promise();
    }

    Primitive.controls()
    .done(function (controls) {
      var promises = [];
      var queries = [];
      src_queries.forEach(function(src_query) {
        var promise = query_converter(src_query, fields, controls)
        .done(function (query) {
          queries.push(query);
        });
        promises.push(promise);
      });
      $.when.apply(null, promises)
      .then(function() {
        dfd.resolve(queries)
      });
    });
    return dfd.promise();
  }

  Grid.prototype.init = function(selector, options) {
    var dfd = new $.Deferred;
    this._selector = selector;
    this._columns = options.columns;
    this._field_map = options.field_map;

    var default_styles = { "width":null, "height":null };
    var styles = Utils.get_as_json(default_styles, function () { return options.styles; });
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
      create_control(self);
      dfd.resolve();
    });
    
    return dfd.promise();
  };

  Grid.prototype.context_menu = function(items, context) {
    var dfd = new $.Deferred;
    
    var self = this;
    if (!items) {
      dfd.resolve();
      return dfd.promise();
    }
    Menu.convert(items, context)
    .then(function (w2ui_items) {
      self._grid.menu = w2ui_items;
      dfd.resolve();
    });
    return dfd.promise();
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
    //this._grid.set(recid, item);
    var index = this._grid.get(recid, true);
    this._grid.records[index] = item;
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
    this._grid.remove.apply(this._grid, recids);
  };

  Grid.prototype.edit = function(on) {
  };

  Grid.prototype.backup = function() {
  };

  Grid.prototype.commit = function() {
  };

  Grid.prototype.restore = function() {
  };

  Grid.prototype.multi_search = function (value) {
    this._grid.multiSearch = value;
    this._grid.show.toolbarSearch = value;
    this._grid.show.toolbarInput = value;
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

  Grid.prototype.numbers = function (on) {
    this._grid.show.lineNumbers = on;
  };

  Grid.prototype.draggable = function (on) {
    this._grid.reorderRows = on;
    if (on) {
      this._grid.show.lineNumbers = on;
    }
  };

  Grid.prototype.items = function(items) {
    if (!items) {
      return;
    }
    
    this._grid.toolbar.items = items;
    // !!! The follow logic is dirty hack !!!
    // <<Reason>>
    // The added all items are not displayed at once.
    // Calling 'refresh' method of toolbar once, only one displayed item is added in toolbar.
    // So, I implement it temporarily to call the 'refresh' method for the number of items.
    // This issue have to be investigated, and be fixed...
    for (var i = 0; i < items.length; i++) {
      this._grid.toolbar.refresh();
    }
    for (var i = 0; i < items.length; i++) {
      var init = items[i].init;
      if (!init || typeof init != "function") {
        continue;
      }
      init(items[i]);
    }
    
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

  Grid.prototype.sort = function() {
    var self = this;
    var compares = this._columns.map(function (column) {
      var name = column.field;
      var field = self._field_map[name].field;
      if (!field || !field.sort_direction) {
        return null;
      }
      return self._field_map[name].compare;
    }).filter(function (compare) {
      return compare == null ? false : true;
    });
    
    var result = null;
    function compare(record1, record2) {
      for (var i = 0; i < compares.length; i++) {
        var result = compares[i](record1, record2);
        if (result != 0) {
          return result;
        }
      }
      return 0;
    };
    this._grid.records.sort(compare);
  };

  Grid.prototype.refresh = function(reorder) {
    if (typeof reorder === "function") {
      this._grid.records.forEach(reorder);
    }
    this._grid.toolbar.refresh();
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
