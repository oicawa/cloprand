define(function (require) {
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  
  var TEMPLATE = '<div></div>';
  
  function Toolbar() {
    this._default_icons = {
      "create": "w2ui-icon-plus",
      "delete": "w2ui-icon-cross",
      "edit"  : "fa fa-pencil",
      "save"  : "fa fa-save",
      "cancel": "fa fa-trash-o",
      "add"   : "w2ui-icon-plus",
      "up"    : "fa fa-arrow-up",
      "down"  : "fa fa-arrow-down"
    };
    this._root = null;;
    this._toolbar = null;
    this._assist = null;
    this._css = null;
    this._instance = this;
    this._operations = {};
  }

  function create_toolbar(self) {
    // Assign click event to 'li' element
    self._root.on("click", "ul > li", function(event) {
      var name = $(this).attr("name");
      var func = self._operations[name]
      func(event);
    });

    // Hover states on the static widgets
    self._root.find("ul.toolbar > li").hover(
      function() { $(this).addClass("ui-state-hover"); },
      function() { $(this).removeClass("ui-state-hover"); }
    );
    
    for (var i = 0; i < self._assist.items.length; i++) {
      var item = self._assist.items[i];
      var icon = self._root.find("ul > li > span." + item.icon_name);
      var li = icon.parent();
      if (item.caption && item.caption != "") {
        var caption = li.find("span.caption");
        caption.addClass("space");
      }
    }
    //var dfd = new $.Deferred;
    //if (!self._assist) {
    //  dfd.resolve();
    //  return dfd.promise();
    //}
    //require([self._assist.operations], function(operations) {
    //  self._operations = {};
    //  for (var i = 0; i < self._assist.items.length; i++) {
    //    var item = self._assist.items[i];
    //    var icon = self._root.find("ul > li > span." + item.icon_name);
    //    var li = icon.parent();
    //    if (item.caption && item.caption != "") {
    //      var caption = li.find("span.caption");
    //      caption.addClass("space");
    //    }
    //    self._operations[item.operation] = operations[item.operation];
    //  }
    //  dfd.resolve();
    //});
    //return dfd.promise();
  }

  Toolbar.prototype.init = function(selector, assist) {
    //console.assert(assist && assist.items, "assit:" + assist);
    var dfd = new $.Deferred;
    this._root = $(selector);
    this._root.hide();
    this._assist = !assist ? { "items" : [] } : assist;
    // Hack...
    for (var i = 0; i < this._assist.items.length; i++) {
      var item = this._assist.items[i];
      item.type = "button";
      item.id = item.name;
      item.icon = this._default_icons[item.id];
    }
    
    var self = this;
    
    Utils.load_css("/data/Style/Toolbar.css");
    
    this._root.append(TEMPLATE);
    var name = Uuid.version4();
    var toolbar = this._root.find("div");
    toolbar.w2toolbar({
      name: name,
      items: this._assist.items,
      onClick: function(event) {
        var func = self._operations[event.item.id]
        func(event);
      }
    });
    //create_toolbar(this);
    
    this._toolbar = w2ui[name];
    
    dfd.resolve();
    return dfd.promise();
  };
  
  Toolbar.prototype.bind = function(name, func) {
    this._operations[name] = func;
  };

  Toolbar.prototype.visible = function(on) {
    if (on) {
      this._root.show();
    } else {
      this._root.hide();
    }
  };

  Toolbar.prototype.show = function(button_name) {
    this._toolbar.show(button_name);
  };

  Toolbar.prototype.hide = function(button_name) {
    this._toolbar.hide(button_name);
  };

  return Toolbar;
}); 
