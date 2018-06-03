define(function (require) {
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
  var Locale = require("core/Locale");

  var LAYOUT_TEMPLATE = '<div id="layout"></div>';
  var TOP_TEMPLATE = '' +
'<div id="header-panel">' +
'  <div class="header-item""><img id="system-icon" style="height:30px;"/></div>' +
'  <div class="header-item" id="title" style="font-size:20px;"></div>' +
'  <div class="header-item" style="width:100%;"></div>' +
'  <div class="header-item">' +
'    <span id="login_id"></span>' +
'    <div class="div-button" style="display:inline-block;">' +
'      <i class="fa fa-sign-out" onclick="location.href=\'/logout\';"></i>' +
'    </div>' +
'  </div>' +
'</div>';
  var LEFT_TEMPLATE = '<div id="left-panel"></div>';
  var MAIN_TEMPLATE = '<div id="contents-panel"></div>';

  function App() {
    this._layout = null;
    this._title = null;
    this._contents = null;
    this._login_id = null;
    this._config = null;
    this._primitives = null;
  }
  
  App.prototype.title = function() {
    if (arguments.length === 0) {
      return document.title;
    }
    document.title = arguments[0];
    document.title = arguments[0];
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
  
  function show_login_form(self, response) {
    console.log(response);
    var login = (response.login !== null) ? response.login : {
      "logo_height" : null,
      "login_id_caption" : "Login ID",
      "password_caption" : "Password",
      "button_caption" : "Login",
      "error_message" : "Input correct Login ID & Password."
    };

    self.title(Locale.translate(response.system_label));
    self.favicon(response.favicon);

    Connector.resource("core/login.html", "html")
    .done(function (template) {
      var html = template.replace(/{{LOGO_HEIGHT}}/, login.logo_height == null ? "" : "height:" + login.logo_height + "px;")
                         .replace(/{{LOGO}}/, response.logo)
                         .replace(/{{TITLE}}/, Locale.translate(response.system_label))
                         .replace(/{{ANTI_FORGERY_TOKEN}}/, response.anti_forgery_token)
                         .replace(/{{LOGIN_ID_CAPTION}}/, Locale.translate(login.login_id_caption))
                         .replace(/{{PASSWORD_CAPTION}}/, Locale.translate(login.password_caption))
                         .replace(/{{BUTTON_CAPTION}}/, Locale.translate(login.button_caption))
                         ;
      $("body").append(html);

      $("#login-failed-message").text(response.login_try_count <= 0 ? "" : Locale.translate(login.error_message));

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
    });
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
        {type:'left',size:200,resizable:true,hidden:false,style:pstyle,content:LEFT_TEMPLATE},
        {type:'main',style:pstyle,content:MAIN_TEMPLATE}
      ]
    });
    self._layout= w2ui[layout_name];
    self._layout.refresh();

    function image_path(field_name, default_path) {
      var images = self._config[field_name].current;
      if (images.length == 0) {
        return default_path;
      }
      return self._config.site_name + "/" + field_name + "/" + images[0].name;
    }

    var favicon_path = image_path("favicon", "core/logo.svg");
    self.favicon(favicon_path);

    var logo_path = image_path("logo", "core/logo.svg");
    self._system_icon = $("img#system-icon");
    self._system_icon.attr("src", logo_path);

    var title = Locale.translate(self._config.system_label);
    self.title(title);
    self._title = $("div#title");
    self._title.text(title);
    
    self._login_id = $("span#login_id");
    self._login_id.text(self.session.identity);

    self._contents = new Contents();
    self._contents.init("#contents-panel");

    Tree.sample("#left-panel");
  }
  
  App.prototype.init = function() {
    var self = this;
    var CONFIG_OBJECT_ID = "e71de065-9b6a-42c7-9987-ddc8e75672ca";
    
    Css.load("core/app.css")
    .then (function () {
      return Connector.session("identity")
    }).done(function(data){
      self.session = data;
      $.when(
        Storage.read(Class.SYSTEM_ID, CONFIG_OBJECT_ID).done(function(data){ self._config = data; }),
        Storage.read(Primitive.ID).done(function(data){ self._primitives = data; })
      ).then(function() {
        create_frame(self);
      });
    })
    .fail(function (response) {
      console.log("Failed to get session identity. (Login try count = " + response.login_try_count + ")");
      show_login_form(self, response);
    });
  };

  // Create instance, and use this instance as singleton.
  var app = new App();
  
  return app;
});
