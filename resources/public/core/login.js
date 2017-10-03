require.config({
  urlArgs: "version=" + (new Date()).getTime(),
  baseUrl : '/',
  
  shim: {
    'jquery': { exports: '$' },
    'jquery_ui': { deps: ['jquery'] },
    'json2': { deps: ['jquery'] }
    //'w2ui': { deps: ['jquery'] }
  },
  
  paths : {
    jquery : '/lib/jquery-2.1.3',
    jquery_ui : '/lib/jquery-ui-1.12.1',
    json2 : '/lib/json2'
    //w2ui : '/lib/w2ui/w2ui-1.5.rc1'
  }
});

define(['jquery'], function ($) {
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
