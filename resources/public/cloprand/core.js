var cloprand = {
  post : function(post_path, post_data, init_proc, success_proc, error_proc) {
    if (init_proc) {
      init_proc();
    }
    $.ajax({
      type: "post",
      dataType: "json",
      data: post_data,
      cache: true,
      url: "http://localhost:3000/" + post_path,
      success: success_proc,
      error: error_proc
    });
  },

  load_script : function(script_path, callback) {
    $.getScript(script_path, callback);
  },

  load_htmlpart : function(dst_selector, src_selector, data, callback) {
    $(dst_selector).load(src_selector, data, callback);
  },
};

