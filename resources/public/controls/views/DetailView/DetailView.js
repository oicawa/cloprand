define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Detail = require("controls/Detail/Detail");
  var Grid = require("controls/Grid/Grid");
  var Tabs = require("controls/Tabs/Tabs");
  var Contents = require("Contents");
  var app = require("app");

  function DetailView () {
    this._class_id = null;
    this._object_id = null;
    this._class = null;
    this._object = null;
    this._detail = null;
  }
  
  DetailView.edit = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    var detail = view.detail();
    detail.edit(true);
  };
  
  DetailView.delete = function (event) {
    var res = confirm("Delete this class?");
    if (!res) {
      return;
    }
    
    var tab_info = Contents.get_tab_info(event);
    var objects = null;
    Utils.delete_data(tab_info.class_id, tab_info.object_id, function(response) { objects = response; })
    .then(function() {
      alert("Deleted");
      app.contents().remove(tab_info.tab_id);
      app.contents().broadcast(tab_info.class_id, tab_info.object_id, null);
    });
  };

  DetailView.save = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    var detail = view.detail();
    var data = detail.data();
    var object = null;
    if (detail.is_new()) {
      Utils.post_data(tab_info.class_id, data, function(response) { object = response;})
      .then(function() {
        detail.edit(false);
        detail.data(object);
        var old_tab_id = tab_info.tab_id;
        var new_tab_id = Contents.tab_id(tab_info.prefix, tab_info.class_id, object.uuid);
        app.contents().change(old_tab_id, new_tab_id, object.label);
        app.contents().broadcast(tab_info.class_id, tab_info.object_id, data);
        alert("Saved");
      });
    } else {
      Utils.put_data(tab_info.class_id, data.uuid, data, function(response) { object = response; })
      .then(function() {
        detail.edit(false);
        detail.commit();
        app.contents().label(tab_info.tab_id, data.label);
        app.contents().broadcast(tab_info.class_id, tab_info.object_id, data);
        alert("Saved");
      });
    }
  };
  
  DetailView.cancel = function (event, li) {
    if (!confirm("Canceled?")) {
      return;
    }
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    var detail = view.detail();
    detail.restore();
    detail.edit(false);
  };
  
  DetailView.prototype.detail = function () {
    return this._detail;
  };
  
  DetailView.prototype.init = function (selector, class_id, object_id) {
    this._class_id = class_id;
    this._object_id = object_id;
    this._detail = new Detail();
    var view = $(selector)
    var template = null;
    var class_ = null;
    var basic_assist = null;
    var custom_assist = null;
    var object = null;
    var self = this;
    var detail_selector = selector + "> .view-panel > .object-detail";
    
    function get_object_data(self, class_id_, object_id_) {
      console.log("[get_object_data] start.");
      if (object_id_ == Utils.NULL_UUID) {
        console.log("Didn't call Utils.get_data method to get object data.");
        var dfd = new $.Deferred;
        dfd.resolve();
        return dfd.promise();
      }

      return Utils.get_data(class_id_, object_id_, function (data) {
        //object = data;
        self._object = data;
        console.log("[Utils.get_data] succedded... " + data);
      });
    }

    $.when(
      Utils.get_template("controls/views", "DetailView", function (data) { template = $.templates(data); }),
      Utils.get_data(Utils.CLASS_UUID, class_id, function (data) { class_ = data; }),
      Utils.get_file(class_id, "DetailView.json", "json", function (data) { basic_assist = data; }),
      Utils.get_file(class_id, "CustomAssist.json", "json", function (data) { custom_assist = data; }, function(data) { return true; }),
      //Utils.get_data(class_id, object_id, function (data) {
      //  console.log("[Utils.get_data] succedded... " + data);
      //  self._object = data;
      //})
      //(function() {
      //  var dfd = new $.Deferred;
      //  if (object_id == Utils.NULL_UUID) {
      //    console.log("Didn't call Utils.get_data method to get object data.");
      //    dfd.resolve();
      //    return dfd.promise();
      //  }
      //  Utils.get_data(class_id, object_id, function (data) {
      //    console.log("[Utils.get_data] succedded.");
      //    console.log(data);
      //    object = data;
      //  })
      //  .then(function() {
      //    console.log("[then]");
      //    console.log(object);
      //    dfd.resolve();
      //  });
      //  return dfd.promise();
      //})()
      get_object_data(self, class_id, object_id)
    ).then(function() {
      var view_html = template.render();
      view.append(view_html);

      self._class = class_;
      console.log("[then]... " + self._object);
      //console.log(object);
      //self._object = object;
      //console.log(self._object);
      
      self._detail.init(detail_selector, self._class, basic_assist, custom_assist)
      .then(function() {
        self._detail.visible(true);
        if (self._object_id == Utils.NULL_UUID) {
          self._detail.edit(true);
        } else {
          self._detail.edit(false);
          console.log("[init] Completed *Detail*... " + self._object);
          self._detail.data(self._object);
        }
      });
    });
  };

  return DetailView;
});
