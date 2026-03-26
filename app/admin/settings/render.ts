import { BUTTON_CSS } from '../shared/datatables-helpers';

export const ADMIN_SETTINGS_TITLE = 'Admin Settings';
export const ADMIN_SETTINGS_HELPER = 'Please enter settings for TTC portal';
export const ADMIN_SETTINGS_CONTAINER_ID = 'settings_page';

const SETTINGS_CSS = `
<style>
  ${BUTTON_CSS}
  .textbox { width: 100%; max-width: 400px; padding: 6px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 14px; }
  .label_required { font-weight: 400; }
  .label_required::after { content: ' *'; color: #c62828; }
  .silver-hr { border: none; border-top: 1px solid #ddd; margin: 15px 0; }
  .settings-row { display: flex; gap: 20px; margin-bottom: 12px; align-items: flex-start; }
  .settings-row .left { flex: 1; max-width: 400px; }
  .settings-row .right { flex: 1; max-width: 400px; }
  .an-c2a-button {
    display: inline-block; padding: 8px 20px; background: #1565c0; color: white;
    border-radius: 3px; cursor: pointer; text-decoration: none; font-size: 14px;
  }
  .an-c2a-button:hover { background: #0d47a1; }
  #step_submit {
    position: fixed; bottom: 0; left: 0; right: 0; background: white;
    z-index: 13; border-top: 1px solid #eee; padding: 8px; text-align: center;
  }
</style>`;

export function renderAdminSettings(): string {
  const appScript = `
<script type="text/javascript">
var repeat_question_list = {
  "i_whitelisted_user": ["i_whitelisted_user_name", "i_whitelisted_user_email"]
};
var REPEATER_DISPLAY_INPUT_CNT = 2;

function postErrorMessage(msg) {
  var el = document.getElementById('step_post_submit_message');
  if (el) el.innerHTML = '<div style="color:red;padding:10px;">' + msg + '</div>';
}

function postDoneMessage(msg) {
  var el = document.getElementById('step_post_submit_message');
  if (el) el.innerHTML = '<div style="color:green;padding:10px;">' + msg + '</div>';
}

function hideLoadingIndicator() {}

function checkFieldsNonEmpty(fields) {
  for (var i = 0; i < fields.length; i++) {
    var val = $('#' + fields[i]).val();
    if (!val || val.trim() === '') return false;
  }
  return true;
}

function initializeRequiredFields() {}

function disableInputs(is_recoverable) {
  $("input[id^=i_],textarea[id^=i_],select[id^=i_]").prop("disabled", true);
  if (!is_recoverable) {
    $('input[name=btns_save_submit]').remove();
    $('#step_submit').show();
  } else {
    $('#step_submit').hide();
  }
}

function enableInputs() {
  $("input[id^=i_],textarea[id^=i_],select[id^=i_]").prop("disabled", false);
  $('#step_submit').show();
}

function new_repeat_entry(id) {
  $('#' + id).append($('<option>', { value: "new_entry", text: "New Entry" }));
  $('#' + id).val("new_entry");
  var input_list = repeat_question_list[id];
  for (var i = 0; i < input_list.length; i++) {
    $('#' + input_list[i]).val("");
    $("label[for='" + input_list[i] + "']").show();
    $('#' + input_list[i]).show();
    $('div[name=' + input_list[i] + ']').show();
    $('label[name=' + input_list[i] + ']').show();
  }
  $('#' + id + '_save').show();
}

function remove_repeat_entry(id) {
  var _val = $('#' + id).val();
  if (_val === 'new_entry') {
    $('#' + id).val("summary").change();
  } else {
    if (_val === '' || _val === 'summary') {
      postErrorMessage("Please select an entry from the dropdown to delete");
      return false;
    }
    $("#" + id + " option[value='" + _val + "']").remove();
    $('#' + id).val("summary").change();
  }
}

function save_repeat_entry(id) {
  var _val = $('#' + id).val();
  if (_val === 'new_entry') {
    var input_list = repeat_question_list[id];
    if (!checkFieldsNonEmpty(input_list)) {
      postErrorMessage("Please enter all details to save");
      return false;
    }
    var _name = "";
    for (var i = 0; i < Math.min(input_list.length, REPEATER_DISPLAY_INPUT_CNT); i++) {
      var _n = $('#' + input_list[i]).val();
      if (_n && _n.trim() !== '') {
        if (_name !== '') _name += ' \\u2022 ';
        _name += _n.trim();
      }
    }
    if (_name === '') _name = 'Entry';

    var _obj = {};
    for (var j = 0; j < input_list.length; j++) {
      if ($('#' + input_list[j]).is(':visible')) {
        var _i_val = $('#' + input_list[j]).val();
        if (_i_val) _obj[input_list[j]] = _i_val.trim();
      }
    }
    $('#' + id).append($('<option>', { value: JSON.stringify(_obj), text: _name }));
    $('#' + id).val("summary").change();
    postDoneMessage("Entry Added");
  }
}

function getPageData() {
  var _form_data = {};
  var _repeat_questions_arr = [];
  for (var id in repeat_question_list) {
    _repeat_questions_arr.push.apply(_repeat_questions_arr, repeat_question_list[id]);
  }
  $('#${ADMIN_SETTINGS_CONTAINER_ID}').find("input[id^=i_],textarea[id^=i_],select[id^=i_]").each(function() {
    var _id = $(this).attr('id');
    if (!_repeat_questions_arr.includes(_id)) {
      if ($(this).attr('form-entry-type') === 'repeater') {
        _form_data[_id] = [];
        $(this).find('option').each(function() {
          var _val = $(this).val();
          if (_val !== 'summary' && _val !== 'new_entry') {
            try { _form_data[_id].push(JSON.parse(_val)); } catch(e) {}
          }
        });
      } else {
        _form_data[_id] = $(this).val();
      }
    }
  });
  return _form_data;
}

function savePage() {
  var _form_data = getPageData();
  $.post("admin/set-config", { config_params: JSON.stringify(_form_data) })
    .done(function(data) {
      try {
        var params = JSON.parse(data);
        if (params.message) $('#step_post_submit_message').html(params.message);
      } catch(e) {}
      postDoneMessage("Your data has been saved");
    })
    .fail(function() {
      postErrorMessage("There was an error saving your data");
    });
}

function loadSettings() {
  disableInputs(true);
  $.get("admin/get-config", {})
    .done(function(data) {
      var _form_data = JSON.parse(data);
      var _repeat_questions_arr = [];
      for (var id in repeat_question_list) {
        _repeat_questions_arr.push.apply(_repeat_questions_arr, repeat_question_list[id]);
      }
      $("input[id^=i_],textarea[id^=i_],select[id^=i_]").each(function() {
        var _id = $(this).attr('id');
        if (!_repeat_questions_arr.includes(_id)) {
          if ($(this).attr('form-entry-type') === 'repeater') {
            if (_id in _form_data) {
              var _repeat_questions = repeat_question_list[_id];
              var _repeat_data_arr = _form_data[_id];
              for (var i = 0; i < _repeat_data_arr.length; i++) {
                var _name = "";
                for (var j = 0; j < Math.min(_repeat_questions.length, REPEATER_DISPLAY_INPUT_CNT); j++) {
                  var _rqid = _repeat_questions[j];
                  if (_repeat_data_arr[i].hasOwnProperty(_rqid)) {
                    var _n = _repeat_data_arr[i][_rqid];
                    if (_n && _n !== '') {
                      if (_name !== '') _name += ' \\u2022 ';
                      _name += _n;
                    }
                  }
                }
                if (_name === '') _name = 'Entry';
                $('#' + _id).append($('<option>', { value: JSON.stringify(_repeat_data_arr[i]), text: _name }));
              }
              $('#' + _id).val('summary').change();
            }
          } else {
            if (_id in _form_data) {
              $(this).val(_form_data[_id]);
            }
          }
        }
      });
      enableInputs();
      postDoneMessage("Your settings have been retrieved");
    })
    .fail(function() {
      postErrorMessage("There was an error retrieving your settings. Please refresh the page.");
    });
}

$(document).ready(function() {
  loadSettings();
  initializeRequiredFields();

  for (var id in repeat_question_list) {
    $('#' + id).on('change', function() {
      var _id = $(this).attr('id');
      var _val = $(this).val();
      if (_val !== 'new_entry') {
        $("#" + _id + " option[value='new_entry']").remove();
        var input_list = repeat_question_list[_id];
        for (var i = 0; i < input_list.length; i++) {
          $("label[for='" + input_list[i] + "']").hide();
          $('#' + input_list[i]).hide();
          $('div[name=' + input_list[i] + ']').hide();
          $('label[name=' + input_list[i] + ']').hide();
        }
        $('#' + _id + '_save').hide();
      }
      if (_val === 'summary') {
        var _num = $("#" + _id + " option[value!='summary']").length;
        $('#' + _id + '_count').html(_num);
        $("#" + _id + " option[value='summary']").text(_num + ' added');
      }
    });
    $('#' + id).change();
  }
});
</script>`;

  return `${SETTINGS_CSS}
<div class="site-container">
  <div class="form-header-block" style="text-align:left;">
    Admin Settings
    <div class="smallertext" style="margin-top:13px;">
      ${ADMIN_SETTINGS_HELPER}
    </div>
  </div>

  <div id="${ADMIN_SETTINGS_CONTAINER_ID}" style="margin-top:20px;">
    <hr class="silver-hr">

    <div style="margin-bottom:15px;">
      <div style="margin-bottom:8px;">
        <strong>Whitelisted Users</strong>
        (<span id="i_whitelisted_user_count">0</span> added)
      </div>
      <div class="smallertext" style="margin-bottom:10px;">
        Please enter users who you want to whitelist to allow application or evaluation submission even after the deadline.
        See the dropdown for users already added.
      </div>

      <div style="margin-bottom:10px;">
        <select id="i_whitelisted_user" form-entry-type="repeater" required style="max-width:300px;">
          <option value="summary">0 added</option>
        </select>
        &nbsp;
        <a class="an-simple-button" onclick="new_repeat_entry('i_whitelisted_user');">+ New</a>
        &nbsp;
        <a class="an-simple-button" onclick="remove_repeat_entry('i_whitelisted_user');">- Remove</a>
      </div>

      <div name="i_whitelisted_user_name" style="margin-bottom:8px;">
        <label name="i_whitelisted_user_name" for="i_whitelisted_user_name" class="label_required">Name</label>
        <div class="smallertext">The name here is only for identification purposes.</div>
        <input class="textbox" type="text" id="i_whitelisted_user_name">
      </div>

      <div name="i_whitelisted_user_email" style="margin-bottom:8px;">
        <label name="i_whitelisted_user_email" for="i_whitelisted_user_email" class="label_required">Email</label>
        <div class="smallertext">Ensure that this is the email address they will login with.</div>
        <input class="textbox" type="text" id="i_whitelisted_user_email">
      </div>

      <div id="i_whitelisted_user_save" style="margin-bottom:15px;">
        <a class="an-simple-button" onclick="save_repeat_entry('i_whitelisted_user');">Add User</a>
        <div class="smallertext" style="margin-top:7px;font-style:italic;">
          Remember to save your entry by clicking "Add User"
        </div>
      </div>

      <hr class="silver-hr">
    </div>
  </div>

  <div id="step_submit">
    <a id="btn_save" name="btns_save_submit" class="an-c2a-button" onclick="savePage();">Save</a>
  </div>

  <div id="step_post_submit_message" style="margin-top:15px;margin-bottom:60px;"></div>
</div>
${appScript}`;
}
