define(function (require) {
  require("jquery");
  require("jsrender");
  var Utils = require("data/Core/Utils");
  
  var TEMPLATE = `
<ul class="ui-widget ui-helper-clearfix toolbar">
{{for items}}
  <li class="ui-state-default ui-corner-all" name="{{:name}}" title="{{:description}}">
    <span class="ui-icon {{:icon_name}}"></span>
    <span class="caption">{{:caption}}</span>
  </li>
{{/for}}
</ul>`;
  
  function Toolbar() {
    this._default_icons = {
      "create": "ui-icon-plus",
      "delete": "ui-icon-minus",
      "edit"  : "ui-icon-pencil",
      "save"  : "ui-icon-disk",
      "cancel": "ui-icon-trash",
      "add"   : "ui-icon-plus",
      "up"    : "ui-icon-arrowthick-1-n",
      "down"  : "ui-icon-arrowthick-1-s"
    };
  	this._root = null;;
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
    for (var i = 0; i < this._assist.items.length; i++) {
      var item = this._assist.items[i];
      if (!item.icon_name) {
        item.icon_name = this._default_icons[item.name];
      }
    }
    
    // Load template data & Create form tags
    var template = $.templates(TEMPLATE);;
    Utils.add_css("/data/Style/Toolbar.css");
    var root_html = template.render(this._assist);
    this._root.append(root_html);
    create_toolbar(this);
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

  Toolbar.prototype.button = function(button_name) {
    return this._root.find("li[name='" + button_name + "']");
  };

  return Toolbar;
}); 
