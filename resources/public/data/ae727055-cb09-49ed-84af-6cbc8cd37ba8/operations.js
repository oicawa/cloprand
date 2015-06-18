define(function (require) {
  require("jquery");
  require("json2");
  //require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Contents = require("Contents");
  var Dialog = require("core/Dialog");
  var app = require("app");
  
  var class_id = Utils.get_class_id();
  //var Toolbar = require("core/controls/Toolbar/Toolbar");
  //var Grid = require("core/controls/Grid/Grid");
  //var Detail = require("core/controls/Detail/Detail");
  function get_tab_id(li) {
    var tab = li.closest("div.tab-panel");
    return tab.attr("id");
  }
  function get_detail(li) {
    var tab_id = get_tab_id(li);
    return crud.tabs().content(tab_id);
  }
  return {
    "add" : function(event) {
      var tab_info = Contents.get_tab_info(event);
      //var url = location.pathname;
      var url = "/index.html?contents=Dialog";
      //window.showModalDialog(
      //  url,   //移動先
      //  this,  //ダイアログに渡すパラメータ（この例では、自分自身のwindowオブジェクト）
      //  "dialogWidth=800px; dialogHeight=480px;status=no");
      var dialog = new Dialog();
      //dialog.init(tab_info.tab_id + ", title);
    },
    "up" : function(event, li) {
      alert("Up");
    },
    "down" : function(event, li) {
      alert("Down");
    },
    "show_detail" : function(event) {
      alert("show_detail");
    }
  };
});
