import { escapeHtml, escapeHtmlAttr } from '../../utils/html';
import {
  BUTTON_CSS,
  DATATABLE_CSS,
  DETAILS_CONTROL_CSS,
  ERROR_MESSAGE_JS,
  EXPORT_BUTTONS_JS,
  FULLSCREEN_MESSAGE_JS,
  STATUS_COLOR_JS,
} from '../shared/datatables-helpers';
import { FORMAT_DATE_JS, STRING2DATE_JS } from '../shared/date-helpers';

export const POST_TTC_FEEDBACK_TITLE = 'Admin: Post TTC Report';
export const POST_TTC_FEEDBACK_TABLE_ID = 'post_ttc_feedback_summary';

export type PostTtcFeedbackRenderOptions = {
  reportingKey: string;
};

export function renderPostTtcFeedback(options: PostTtcFeedbackRenderOptions): string {
  const rk = escapeHtml(options.reportingKey);

  const pageStyles = `
<style>
  ${DETAILS_CONTROL_CSS}
  ${DATATABLE_CSS}
  ${BUTTON_CSS}
</style>`;

  const appScript = `
<script type="text/javascript">
var user_data = undefined;
var table = undefined;

${STATUS_COLOR_JS}

${FULLSCREEN_MESSAGE_JS}

${ERROR_MESSAGE_JS}

function postInfoMessage(msg) {
  var el = document.getElementById('step_post_submit_message');
  if (el) {
    el.innerHTML = '<div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">' + msg + '</div>';
  }
}

${STRING2DATE_JS}

${FORMAT_DATE_JS}

function isEmpty(v) { return v === undefined || v === null || v === ''; }

function get_user_data() {
  if (user_data) return;
  $.get("reporting/user-summary/get-by-user", {})
    .done(function(data) {
      user_data = JSON.parse(data || '{}');
      if (!user_data || (typeof user_data === 'object' && Object.keys(user_data).length === 0)) {
        postInfoMessage('No reporting data yet. Upload data and run reporting jobs.');
      }
      load_table_data();
    })
    .fail(function() {
      postErrorMessage("There was an error retrieving the feedback data.");
    });
}

function get_table_data() {
  var applicant_data = {};
  var r_applicant_data = [];

  for (var _ae_raw in user_data) {
    if (user_data[_ae_raw].hasOwnProperty('post_ttc_self_evaluation_form')) {
      var _ae = _ae_raw.toLowerCase();
      var _self_evaluations = user_data[_ae_raw]['post_ttc_self_evaluation_form'];

      if (!applicant_data.hasOwnProperty(_ae)) {
        applicant_data[_ae] = {
          evaluations_count: 0, evaluations: [], evaluations_status: 'pending',
          self_evaluations: [], self_evaluations_submitted_count: 0
        };
      }

      for (var _te in _self_evaluations['${rk}']['evaluations']) {
        for (var _fi in _self_evaluations['${rk}']['evaluations'][_te]) {
          for (var _ve in _self_evaluations['${rk}']['evaluations'][_te][_fi]) {
            var _evaluation = user_data[_te]['post_ttc_feedback_form'][_fi][_ve];
            _evaluation['course_start_date'] = string2date(_evaluation.data.i_course_start);
            var _rs = _evaluation['${rk}']['reporting_status'];
            if (_rs === 'submitted' || _rs === 'complete') {
              applicant_data[_ae]['evaluations_count'] += 1;
            }
            applicant_data[_ae]['evaluations'].push(_evaluation);
          }
        }
      }
      if (applicant_data[_ae]['evaluations_count'] > 0) {
        applicant_data[_ae]['evaluations_status'] = 'submitted: ' + applicant_data[_ae]['evaluations_count'];
      }

      for (var _tcd1 in _self_evaluations) {
        if (_self_evaluations.hasOwnProperty(_tcd1) && _tcd1 !== '${rk}') {
          var _self_evaluation = _self_evaluations[_tcd1];
          if ('data' in _self_evaluation) {
            var _reporting_status = _self_evaluation['${rk}']['reporting_status'];
            if (isEmpty(applicant_data[_ae]['name'])) {
              applicant_data[_ae]['name'] = _self_evaluation['data']['i_fname'] + ' ' + _self_evaluation['data']['i_lname'];
              applicant_data[_ae]['email'] = _ae;
            }
            if (isEmpty(applicant_data[_ae]['ttc_dates'])) {
              applicant_data[_ae]['ttc_dates'] = _self_evaluation['data']['i_ttc_dates'];
              applicant_data[_ae]['ttc_location'] = _self_evaluation['data']['i_ttc_location'];
              applicant_data[_ae]['cellphone'] = _self_evaluation['data']['i_cellphone'];
              applicant_data[_ae]['homephone'] = _self_evaluation['data']['i_homephone'];
            }
            if (_reporting_status === 'submitted' || _reporting_status === 'complete') {
              applicant_data[_ae]['self_evaluations_submitted_count'] += 1;
            }
            if (applicant_data[_ae]['self_evaluations_submitted_count'] > 0) {
              applicant_data[_ae]['status'] = 'submitted: ' + applicant_data[_ae]['self_evaluations_submitted_count'];
            } else {
              applicant_data[_ae]['status'] = _reporting_status;
            }
            _self_evaluation['course_start_date'] = string2date(_self_evaluation.data.i_course_start);
            applicant_data[_ae]['self_evaluations'].push(_self_evaluation);
          }
        }
      }
    }

    if (user_data[_ae_raw].hasOwnProperty('post_ttc_feedback_form')) {
      var _evaluations = user_data[_ae_raw]['post_ttc_feedback_form'];
      for (var _tcd2 in _evaluations) {
        for (var _ve_raw in _evaluations[_tcd2]) {
          var _ev = _evaluations[_tcd2][_ve_raw];
          if (_ev && _ev.hasOwnProperty('${rk}') && _ev['${rk}'].hasOwnProperty('is_reporting_matched') && _ev['${rk}']['is_reporting_matched'] === 'N') {
            _ev['course_start_date'] = string2date(_ev.data.i_course_start);
            var _ae2 = _ve_raw.toLowerCase();
            if (!applicant_data.hasOwnProperty(_ae2)) {
              applicant_data[_ae2] = {
                evaluations_count: 0, evaluations: [],
                self_evaluations: [], self_evaluations_submitted_count: 0
              };
            }
            if (isEmpty(applicant_data[_ae2]['name'])) {
              applicant_data[_ae2]['name'] = _ev['data']['i_ttc_graduate_name'];
              applicant_data[_ae2]['email'] = _ev['data']['i_ttc_graduate_email'];
              applicant_data[_ae2]['status'] = 'pending';
              applicant_data[_ae2]['ttc_dates'] = '';
              applicant_data[_ae2]['ttc_location'] = '';
              applicant_data[_ae2]['cellphone'] = '';
              applicant_data[_ae2]['homephone'] = '';
            }
            var _rs2 = _ev['${rk}']['reporting_status'];
            if (_rs2 === 'submitted' || _rs2 === 'complete') {
              applicant_data[_ae2]['evaluations_count'] += 1;
            }
            if (applicant_data[_ae2]['evaluations_count'] > 0) {
              applicant_data[_ae2]['evaluations_status'] = 'submitted: ' + applicant_data[_ae2]['evaluations_count'];
            } else {
              applicant_data[_ae2]['evaluations_status'] = _rs2;
            }
            applicant_data[_ae2]['evaluations'].push(_ev);
          }
        }
      }
    }
  }

  for (var _ae3 in applicant_data) {
    r_applicant_data.push(applicant_data[_ae3]);
  }
  return r_applicant_data;
}

function load_table_data() {
  var applicant_data = get_table_data();
  if (table) {
    table.clear();
    table.rows.add(applicant_data);
    table.draw();
  } else {
    table = $('#${POST_TTC_FEEDBACK_TABLE_ID}').DataTable({
      data: applicant_data,
      orderCellsTop: true,
      scrollX: true,
      iDisplayLength: 50,
      dom: 'Bfrtlip',
      buttons: ${EXPORT_BUTTONS_JS},
      columns: [
        {className:'details-control', orderable:false, data:null, defaultContent:''},
        {data:'name'}, {data:'status'}, {data:'evaluations_status'},
        {data:'ttc_dates'}, {data:'ttc_location'}, {data:'email'},
        {data:'cellphone'}, {data:'homephone'}
      ],
      order: [[1,'asc']],
      rowCallback: function(row, data) {
        $(row).find('td:eq(2)').css('color', getStatusColor(data.status));
        $(row).find('td:eq(3)').css('color', getStatusColor(data.evaluations_status));
      }
    });

    $('#${POST_TTC_FEEDBACK_TABLE_ID} tbody').on('click', 'td.details-control', function() {
      var tr = $(this).closest('tr');
      var row = table.row(tr);
      if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown');
      } else {
        row.child(format(row.data())).show();
        tr.addClass('shown');
      }
    });
  }
}

function view_form_standalone(form_type, email, form_instance) {
  window.open("reporting/user-report/get-user-application?email=" +
    encodeURIComponent(email) + "&form_type=" + encodeURIComponent(form_type) +
    "&form_instance=" + encodeURIComponent(form_instance));
}

function format(d) {
  var _rows = '';
  if (d.email === '') {
    for (var j = 0; j < d.self_evaluations.length; j++) {
      var _c = d.self_evaluations[j];
      for (var i = 0; i < _c.evaluations.length; i++) {
        var _e = _c.evaluations[i];
        _rows +=
          '<table class="w-full border border-[#eee] bg-white px-[13px] py-0 mb-[13px]">' +
            '<tr>' +
              '<td class="bg-white">Evaluator:</td>' +
              '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_fname||'') + ' ' + (_e.data.i_lname||'') + '</td>' +
              '<td class="bg-white">Email:</td>' +
              '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_email_aol||'') + '</td>' +
              '<td class="bg-white">Status:</td>' +
              '<td class="bg-white" style="color:' + getStatusColor(_e['${rk}'].reporting_status) + ';">' + _e['${rk}'].reporting_status + '</td>' +
              '<td class="bg-white"><a class="an-simple-button" onclick="view_form_standalone(\\'post_ttc_feedback_form\\',\\'' + encodeURIComponent(_e.email) + '\\',\\'' + encodeURIComponent(_e.form_instance) + '\\');">View</a></td>' +
            '</tr>' +
            '<tr>' +
              '<td class="bg-white">Volunteer:</td>' +
              '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_ttc_graduate_name||'') + '</td>' +
              '<td class="bg-white">Email:</td>' +
              '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_ttc_graduate_email||'') + '</td>' +
              '<td class="bg-white">Course Start:</td>' +
              '<td class="bg-white">' + (_e.data.i_course_start||'') + '</td>' +
              '<td class="bg-white"></td>' +
            '</tr>' +
          '</table>';
      }
    }
  } else {
    var _display_forms = [];
    if (d.hasOwnProperty('self_evaluations')) Array.prototype.push.apply(_display_forms, d.self_evaluations);
    if (d.hasOwnProperty('evaluations')) Array.prototype.push.apply(_display_forms, d.evaluations);

    _display_forms.sort(function(a, b) {
      if (a.course_start_date === null) return 9999;
      if (b.course_start_date === null) return -9999;
      return (a.course_start_date - b.course_start_date) / (1000 * 60 * 60 * 24);
    });

    _rows += '<div class="mb-[5px] text-[15px]">Self and Teacher feedback sorted in order of course date:</div>';
    _rows += '<table class="w-full border border-[#eee] bg-white px-[13px] py-0 mb-[13px]">';
    for (var k = 0; k < _display_forms.length; k++) {
      var _f = _display_forms[k];
      var _dateStr = _f.course_start_date ? formatDate(_f.course_start_date) : '';
      if (_f.data.hasOwnProperty('i_ttc_graduate_email')) {
        _rows +=
          '<tr>' +
            '<td class="bg-white font-bold text-[#7c3602] font-mono">EVAL</td>' +
            '<td class="bg-white">Course Date: ' + _dateStr + '</td>' +
            '<td class="bg-white" style="color:' + getStatusColor(_f['${rk}'].reporting_status) + ';">' + _f['${rk}'].reporting_status + '</td>' +
            '<td class="bg-white border-r border-[#eee]">' + (_f.data.i_fname||'') + ' ' + (_f.data.i_lname||'') + '</td>' +
            '<td class="bg-white border-r border-[#eee]">' + (_f.data.i_email_aol||'') + '</td>' +
            '<td class="bg-white"><a class="an-simple-button" onclick="view_form_standalone(\\'post_ttc_feedback_form\\',\\'' + encodeURIComponent(_f.email) + '\\',\\'' + encodeURIComponent(_f.form_instance) + '\\');">View</a></td>' +
          '</tr>';
      } else {
        _rows +=
          '<tr>' +
            '<td class="bg-white font-bold text-[#176792] font-mono">SELF</td>' +
            '<td class="bg-white">Course Date: ' + _dateStr + '</td>' +
            '<td class="bg-white" style="color:' + getStatusColor(_f['${rk}'].reporting_status) + ';">' + _f['${rk}'].reporting_status + '</td>' +
            '<td class="bg-white"></td>' +
            '<td class="bg-white"></td>' +
            '<td class="bg-white"><a class="an-simple-button" onclick="view_form_standalone(\\'post_ttc_self_evaluation_form\\',\\'' + encodeURIComponent(d.email) + '\\',\\'' + encodeURIComponent(_f.form_instance) + '\\');">View</a></td>' +
          '</tr>';
      }
    }
    _rows += '</table>';
  }
  return _rows;
}

$(document).ready(function() {
  get_user_data();
});
</script>`;

  return `${pageStyles}
<div class="max-w-7xl mx-auto p-6">
  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-6">
    <h1 class="text-2xl font-light mb-2">${escapeHtml(POST_TTC_FEEDBACK_TITLE)}</h1>
    <div class="smallertext mb-[7px]">Please see below Post TTC feedback for country</div>
    <table id="${escapeHtmlAttr(POST_TTC_FEEDBACK_TABLE_ID)}" class="display nowrap cell-border w-full">
      <thead class="uppercase font-light">
        <tr>
          <th></th>
          <th>Name</th>
          <th>Status</th>
          <th>Evaluations</th>
          <th>TTC Dates</th>
          <th>TTC Location</th>
          <th>Email</th>
          <th>Cell Phone</th>
          <th>Home Phone</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th></th>
          <th colspan="8" class="text-left">Total Submitted Feedback:</th>
        </tr>
      </tfoot>
    </table>

    <div id="step_post_submit_message"></div>
  </div>
</div>
${appScript}`;
}
