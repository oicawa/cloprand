function normal_initialize() {
  $("#result_area").text("** Loading... **");
}

function normal_success_proc(response_data) {
  $("#result_area").text(response_data.value);
}

function normal_error_proc(xhr, status, err) {
  var message = "Error occured: status=" + status + ", err=" + err;
  $('#result_area').html(message);
}
    
function create_table(table_name) {
  cloprand.post("create_table", { "table_name": table_name }, "** Creating... **", normal_success_proc, normal_error_proc);
}

function delete_table(table_name) {
  cloprand.post("delete_table", { "table_name": table_name }, "** Deleting... **", normal_success_proc, normal_error_proc);
}

function get_tables() {
  cloprand.post("get_tables", { "table_name": "" }, "** Geting... **", function(response_data) {
    var count = response_data.value.length;
    var result = "";
    for (var i = 0; i < count; i++) {
      result += "<div>" + response_data.value[i] + "</div>";
    }
    $("#result_area").html(result);
  },
  normal_error_proc);
}

var db_tables = {
  table_admin : function () {
    $("#create_table_button").click(function() {
      var table_name = $("input[name='table_name']").val();
      create_table(table_name);
      return false;
    });
    $("#delete_table_button").click(function() {
      var table_name = $("input[name='table_name']").val();
      delete_table(table_name);
      return false;
    });
    $("#get_tables_button").click(function() {
      get_tables();
      return false;
    });
  },
};
