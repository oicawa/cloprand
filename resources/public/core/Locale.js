define(function (require) {
  function browser_locale() {
    var ua = window.navigator.userAgent.toLowerCase();
    try {
      // chrome
      if(ua.indexOf('chrome') != -1){
        return (navigator.languages[0] || navigator.browserLanguage || navigator.language || navigator.userLanguage);
      }
      // others
      return (navigator.browserLanguage || navigator.language || navigator.userLanguage);
    } catch(e) {
      return null;
    }
  }
  
  function browser_language(locale) {
    locale = !locale ? browser_locale() : locale;
    if (!locale) {
      return null;
    }
    return locale.substr(0,2);
  }
  
  return {
    locale : browser_locale,
    language : browser_language,
    translate : function(value) {
      var lo = browser_locale();
      if (!lo) {
        return value[""];
      }
      var translated = value[lo];
      if (translated && 0 < translated.length) {
        return translated
      }
      // undefined or null or ""
      var la = browser_language(lo);
      if (!la) {
        return value[""];
      }
      translated = value[la];
      if (translated && 0 < translated.length) {
        return translated
      }
      return value[""];
    }
  };
});
