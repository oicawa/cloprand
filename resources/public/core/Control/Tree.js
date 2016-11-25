define(function (require) { 
  require("jquery");
  var Uuid = require("core/Uuid");

  var TEMPLATE = '<div id="{{TREE_ID}}"></div>';

  function Tree() {
    this._root = null;
    this._uuid = null;
    this._tree = null;
    this._renderers = {};
    this._data = null;
    //this._data = {
    //  ""     : { "data" : null,   "order" : ["id-1", "id-2", "id-3"] },
    //  "id-1" : { "data" : data_1, "order" : ["id-10", "id-11", "id-11"] },
    //  "id-2" : { "data" : data_2, "order" : [] },
    //  "id-3" : { "data" : data_3, "order" : ["id-30", "id-31"] },
    //  ...
    //  ...
    //  ...
    //};
  }

  Tree.prototype.init = function(selector) {
    var dfd = new $.Deferred;
    this._uuid = Uuid.version4();
    var html = TEMPLATE.replace(/{{TREE_ID}}/, this._uuid);
    
    this._root = $(selector);
    this._root.append(html);
    var self = this;
    this._tree = $("#" + this._uuid);
    this._tree.on("remove", function(event) {
      delete w2ui[self._uuid];
    });
    this._tree.w2sidebar({
      name:this._uuid,
      nodes:[],
      style: "height:300px;",
      onClick: function(event) {
        console.log(event.target);
      },
      onDestroy: function(event) {
        delete w2ui[self._uuid];
      }
    });
    
    dfd.resolve();
    return dfd.promise();
  };
  
  Tree.prototype.convert = function (items) {
    var nodes = items.map(function (item) {
      var class_id = item["class_id"];
      var renderer = this._renderers[class_id];
      return { id: item["id"], text: renderer(item) };
    });
    return nodes;
  }

  Tree.prototype.add = function(parent_id, items) {
    var nodes = this.convert(items);
    if (!parent_id) {
      w2ui[self._uuid].add(nodes);
    } else {
      w2ui[self._uuid].add(parent_id, nodes);
    }
  };

  Tree.prototype.insert = function(parent_id, items) {
    var nodes = this.convert(items);
    w2ui[self._uuid].insert(parent_id, before_id, nodes);
    w2ui[self._uuid].expand(parent_id);
  };

  Tree.prototype.remove = function(ids) {
    w2ui[self._uuid].remove.apply(w2ui[self._uuid], ids);
  };

  Tree.prototype.refresh = function(target_id) {
    var target_item = this._data[!target_id ? "" : target_id];
    //{ "data" : data, "order" : ["id-1", "id-2", "id-3"] },
    var data = target_item["data"];
    var order = target_item["order"];
    
  };

  Tree.prototype.data = function(value) {
    this._data = value;
  };
  
  Tree.prototype.update = function(keys) {
  };

  return Tree;
});
