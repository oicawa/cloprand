define(function (require) { 
  require("jquery");
  require("w2ui");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Connector = require("core/Connector");
  var Dialog = require("core/Dialog");
  var Inherits = require("core/Inherits");
  var Toolbar = require("core/Control/Toolbar");
  var Grid = require("core/Control/Grid");
  var Detail = require("core/Control/Detail");
  var Field = require("core/Control/Field/Field");
  var app = require("app");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <div class="toolbar" style="display:none;"></div>' +
'  <div class="records"></div>' +
'</div>';
  
  var default_toolbar = {
    "operations" : Utils.CLASS_ID,
    "items" : [
      { "name": "add",    "caption": "Add",    "description": "Add new field",               "operation": "add" },
      { "name": "edit",   "caption": "Edit",   "description": "Edit field",                  "operation": "edit" },
      { "name": "delete", "caption": "Delete", "description": "Delete field",                "operation": "delete" },
      { "name": "properties", "caption": "Properties", "description": "Edit properties field", "operation": "properties" },
      { "name": "up",     "caption": "Up",     "description": "Move upward selected item",   "operation": "up" },
      { "name": "down",   "caption": "Down",   "description": "Move downward selected item", "operation": "down" }
    ]
  };
  
  function showDetailDialog(self, title, fields, data, ok_func) {
    var body_id = Uuid.version4();
    var ok_id = Uuid.version4();
    var cancel_id = Uuid.version4();
    var buttons = '' +
      '<input type="button" style="width:100px;" value="OK" id="' + ok_id + '" />' +
      '<input type="button" style="width:100px;" value="Cancel" id="' + cancel_id + '" />';
    var detail = new Detail();
    w2popup.open({
      title   : title,
      body    : '<div id="' + body_id + '"></div>',
      buttons : buttons,
      //width   : 700,
      //height  : 550,
      onOpen  : function(event) {
        event.onComplete = function() {
          $("#" + ok_id).on("click", function(event) {
            console.log("[OK] clicked");
            ok_func(detail);
            w2popup.close();
            return false;
          });
          $("#" + cancel_id).on("click", function(event) {
            console.log("[Cancel] clicked");
            w2popup.close();
            return false;
          });
          detail.init("#" + body_id, fields)
          .then(function() {
            detail.data(data);
            detail.visible(true);
            detail.edit(true);
            var width = detail._root.css("width");
            var height = detail._root.css("height");
            console.log("[Step1] width=" + width + ", height=" + height);
            width = parseInt(width) + 200;
            height = parseInt(height)　+ 120;
            console.log("[Step2] width=" + width + ", height=" + height);
            w2popup.resize(width, height);
          });
        }
      }
    });
  }

  function Multi() {
    Field.call(this, "core/Control/Field", "Multi");
    this._toolbar = null;
    this._grid = null;
    this._detail = null;
    this._dialog = null;
    this._data = null;
    this._backuped = null;
  };
  Inherits(Multi, Field);
  
  Multi.prototype.init = function(selector, field, assist) {
    var dfd = new $.Deferred;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    var class_ = null;
    var self = this;
    var class_id = field.datatype.properties.class_id;
    $.when(
      Connector.crud.read("api/" + Utils.CLASS_ID + "/" + class_id, "json", function (data) { class_ = data; })
    ).always(function() {
      root.append(TEMPLATE);
      
      // Create controls
      var label = root.find("label");
      label.text(field.label);
      self._toolbar = new Toolbar();
      self._grid = new Grid();
      //self._detail = new Detail();
      //self._dialog = new Dialog();

      var toolbar = !assist ? default_toolbar : (!assist.toolbar ? default_toolbar : assist.toolbar);

      var columns = Grid.create_columns(class_);
      
      function ok_func(detail) {
        var data = detail.data();
        if (detail.is_new()) {
          self._grid.add(data);
        } else {
          var index = self._grid.selection()[0];
          self._grid.item(index, data);
        }
        self._grid.refresh();
      }

      $.when(
        self._toolbar.init(selector + " > div > div.toolbar", toolbar),
        self._grid.init(selector + " > div > div.records", columns, 'height:300px;')
      ).always(function() {
        self._toolbar.bind("add", function(event) {
          showDetailDialog(self, class_.label, class_.object_fields, null, function (detail) {
            var data = detail.data();
            self._grid.add(data);
            self._grid.refresh();
          });
        });
        self._toolbar.bind("edit", function(event) {
          var selection = self._grid.selection();
          if (selection.length != 1) {
            Dialog.show("Select one item.");
            return;
          }
          var index = selection[0];
          var data = self._grid.data()[index];
          showDetailDialog(self, class_.label, class_.object_fields, data, function (detail) {
            var data = detail.data();
            var index = self._grid.selection()[0];
            self._grid.item(index, data);
            self._grid.refresh();
          });
        });
        self._toolbar.bind("delete", function(event) {
          var selection = self._grid.selection();
          if (selection.length == 0) {
            Dialog.show("Select one or more items.");
            return;
          }
          Dialog.confirm("Delete?", function(answer) {
            if (answer == "No")
              return;
            self._grid.delete(selection);
            self._grid.refresh();
          });
        });
        self._toolbar.bind("properties", function(event) {
          var selection = self._grid.selection();
          if (selection.length != 1) {
            Dialog.show("Select one item.");
            return;
          }
          var index = selection[0];
          var data = self._grid.data()[index];
          var primitive_id = data.datatype.primitive;
          if (!primitive_id || primitive_id == "") {
            Dialog.show("This property type is not Primitive.");
            return;
          }
          var primitive = app._primitives[primitive_id];
          var title = primitive.label + " (" + data.label + ")"
          showDetailDialog(self, title, primitive.properties, data.properties, function(detail) {
            data.properties = detail.data();
          });
        });
        self._toolbar.bind("up", function(event) {
          var message = "Select one item. (without 1st)";
          var selection = self._grid.selection();
          if (selection.length != 1) {
            Dialog.show(message);
            return;
          }
          var index = selection[0];
          if (index == 0) {
            Dialog.show(message);
            return;
          }
          self._grid.move(index, -1);
          self._grid.refresh();
          self._grid.select(index - 1);
        });
        self._toolbar.bind("down", function(event) {
          var message = "Select one item. (without last)";
          var selection = self._grid.selection();
          if (selection.length == 0) {
            Dialog.show(message);
            return;
          }
          var index = selection[0];
          if (index == self._grid.data().length - 1) {
            Dialog.show(message);
            return;
          }
          self._grid.move(index, 1);
          self._grid.refresh();
          self._grid.select(index + 1);
        });
        dfd.resolve();
      });
    });
    return dfd.promise();
  };

  Multi.prototype.backuped = function() {
    return this._backuped;
  };

  Multi.prototype.commit = function() {
    this._backuped = this._grid.data();
  };

  Multi.prototype.restore = function() {
    this._grid.data(this._backuped);
  };

  Multi.prototype.edit = function(on) {
    this._toolbar.visible(on);
  };

  Multi.prototype.data = function(values) {
    if (arguments.length == 0) {
      return this._grid.data();
    } else {
      this._grid.data(values);
      this._backuped = values;
    }
  };
  
  Multi.prototype.refresh = function(on) {
    this._grid.refresh();
  };

  return Multi;
}); 
