define(function (require) {
  //require("jquery");
  //require("json2");
  require("w2ui");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Primitive = require("core/Primitive");
  var Connector = require("core/Connector");
  var Storage = require("core/Storage");
  var Contents = require("core/Contents");
  var Tree = require("core/Control/Tree");
  var Css = require("core/Css");

  var LAYOUT_TEMPLATE = '<div id="layout"></div>';
  var TOP_TEMPLATE = '' +
'<div id="header-panel" style="height: 30px;">' +
'  <img id="system-icon" />' +
'  <span id="title" style="font-size:20px; vertical-align: top;"></span>' +
'  <span style="display:inline-block; width:30px;"></span>' +
'  <span id="sub-title"></span>' +
'  <form method="get" name="signout" action="/logout" style="display:inline-block;position:absolute; right:5px; font-size:11pt;">' +
'    <span id="login_id"></span>' +
'    <div class="div-button" style="display:inline-block;">' +
'      <i class="fa fa-sign-out" onclick="document.signout.submit();"></i>' +
'    </div>' +
'  </form>' +
'</div>';
  var LEFT_TEMPLATE = '<div id="left-panel"></div>';
  var MAIN_TEMPLATE = '<div id="contents-panel"></div>';

  var LOGIN_FORM = '' +
'<div>' +
'<div style="width:100%; text-align:center;height:50px;"/>' +
'<div style="width:100px; height:100px; background-image:url(core/logo.svg); background-size:100%;margin:auto;"/>' +
'<h1 style="text-align:center;height:50px;">{{TITLE}}</h1>' +
'<div style="width:100%; text-align:center;height:50px;"/>' +
'<form method="post" name="login">' +
'  <div style="width:100%; text-align:center;">' +
'    <span style="display:inline-block;width:100px;">Login ID</span>' +
'    <input id="login-id" type="text" name="login_id" style="width:200px;" class="w2field" tabindex="1"/>' +
'    <br/>' +
'    <div style="width:100%;height:10px;"/>' +
'    <span style="display:inline-block;width:100px;">Password</span>' +
'    <input id="login-password" type="password" name="password" style="width:200px;" class="w2field" tabindex="2" />' +
'    <br/>' +
'    <div style="width:100%;height:50px;"/>' +
'    <input type="hidden" name="__anti-forgery-token" value="{{ANTI_FORGERY_TOKEN}}" />' +
'    <input type="submit" style="display:none;" />' +
'    <div id="login-button" class="div-button" style="width:70px;height:70px;margin: auto;" tabindex="3">' +
'      <i class="fa fa-sign-in" style="font-size:35pt;" />' +
'      <div style="font-size:10pt;">Login</div>' +
'    </div>' +
'  </div>' +
'</form>' +
'</div>';

  
  function App() {
    this._layout = null;
    this._title = null;
    this._contents = null;
    this._login_id = null;
    this._config = null;
    this._primitives = null;
  }
  
  App.prototype.title = function() {
    if (arguments.length == 0) {
      return document.title;
    } else if (arguments.length == 1) {
      document.title = arguments[0];
    }
    return Utils.property_value(this, this._title, "text", arguments);
  };
  
  App.prototype.favicon = function(path) {
    var icon = $("link[rel='shortcut icon']");
    icon.attr("href", path);
  };
  
  App.prototype.contents = function() {
    return this._contents;
  };
  
  App.prototype.config = function() {
    return this._config;
  };
  
  function show_login_form(self, anti_forgery_token) {
    var html = LOGIN_FORM.replace(/{{TITLE}}/, "tames").replace(/{{ANTI_FORGERY_TOKEN}}/, anti_forgery_token);
    $("body").append(html);
  	
    $("#login-password").on("keyup", function (event) {
      var KEYCODE_ENTER = 13;
      if (event.keyCode != KEYCODE_ENTER) {
        return;
      }
      document.login.submit();
    });

    $("#login-button")
    .on("keyup", function (event) {
      var KEYCODE_ENTER = 13;
      var KEYCODE_SPACE = 32;
      if (event.keyCode != KEYCODE_ENTER && event.keyCode != KEYCODE_SPACE) {
        return;
      }
      console.log("Submit login by keyup");
      document.login.submit();
    })
    .on("click", function (event) {
      console.log("Submit login by click");
      document.login.submit();
    });
    console.log("location.href=" + location.href);
    $("#login-id").focus();
  }

  function create_frame(self) {
    $("body").append(LAYOUT_TEMPLATE);
    // Create Layout Panel
    var layout_name = Uuid.version4();
    var pstyle='border: 3px solid #dfdfdf; padding: 5px;';
    $("#layout").w2layout({
      name:layout_name,
      panels:[
        {type:'top', size:42, resizable:false, style:pstyle, content:TOP_TEMPLATE},
        {type:'left',size:200,resizable:true,hidden:true,style:pstyle,content:LEFT_TEMPLATE},
        {type:'main',style:pstyle,content:MAIN_TEMPLATE}
      ]
    });
    self._layout= w2ui[layout_name];
    self._layout.refresh();

    var logo_path = "/core/logo.svg";
    var favicon_path = "/core/favicon.ico";

    self._system_icon = $("img#system-icon");
    self._system_icon.attr("src", logo_path);

    self._title = $("span#title");
    self._login_id = $("span#login_id");

    self._contents = new Contents();
    self._contents.init("#contents-panel");

    self.title(self._config.system_label);
    self.favicon(favicon_path);
    self._login_id.text(self.session.identity);

    var tree = new Tree();
    tree.init("#left-panel");
    tree.add(null, [
      //{ id: 'id-1', text: 'Item 1', img: 'icon-folder', expanded: false, group: true, nodes: [] },
      //{ id: 'id-2', text: 'Item 2', img: 'icon-folder', expanded: false, group: true, nodes: [] }
      { id: 'id-1', text: 'Item 1', img: 'icon-folder' },
      { id: 'id-2', text: 'Item 2', img: 'icon-folder' }
    ]);
    tree.insert('id-1', null, [
      { id: 'id-1-1', text: 'Item 1-1', icon: 'fa-star-empty' },
      { id: 'id-1-2', text: 'Item 1-2', icon: 'fa fa-question-circle-o' }
    ]);
    tree.insert('id-2', null, [
      { id: 'id-2-1', text: 'Item 2-1', icon: 'fa-star-empty' },
      { id: 'id-2-2', text: 'Item 2-2', icon: 'w2ui-icon-check' }
    ]);
    tree.refresh();

    var timer = false;
    $(window).on("resize", function () {
      if (timer !== false) {
        clearTimeout(timer);
      }
      timer = setTimeout(function() {
        console.log('window resized');
        var body = $("body");
        var divs = body.find("div[role='dialog'] > div.dialog");
        for (var i = 0; i < divs.length; i++) {
          var dialog = $("#" + divs[i].id);
          dialog.dialog({
            maxHeight : body.height() - 20,
            maxWidth : body.width() - 20
          });
        }
      }, 200);
    });
  }
  
  App.prototype.init = function() {
    var self = this;
    var CONFIG_OBJECT_ID = "e71de065-9b6a-42c7-9987-ddc8e75672ca";
    Connector.session("identity")
    .done(function(data){
      self.session = data;
      $.when(
        Css.load("core/app.css"),
        Storage.read(Class.SYSTEM_ID, CONFIG_OBJECT_ID).done(function(data){ self._config = data; }),
        Storage.read(Primitive.ID).done(function(data){ self._primitives = data; })
      ).then(function() {
        create_frame(self);
      });
    })
    .fail(function (jqXHR) {
      console.log("Failed to get session identity");
      var anti_forgery_token = jqXHR.responseJSON.anti_forgery_token;
      show_login_form(self, anti_forgery_token);
    });
  };

  // Create instance, and use this instance as singleton.
  var app = new App();
  
  return app;
});
