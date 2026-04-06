import { escapeHtml, escapeHtmlAttr } from '../../utils/html';
import {
  BUTTON_CSS,
  DATATABLE_CSS,
  DETAILS_CONTROL_CSS,
  ERROR_MESSAGE_JS,
  EXPORT_BUTTONS_JS,
  FULLSCREEN_MESSAGE_JS,
} from '../shared/datatables-helpers';

export const INTEGRITY_REPORT_TITLE = 'Admin: TTC Integrity Report';
export const INTEGRITY_TABLE_ID = 'ttc_applicants_summary';

export type IntegrityRenderOptions = {
  integrityKey: string;
  ttcListHtml: string;
  userSummaryLastUpdatedDatetime: string;
  userIntegrityLastUpdatedDatetime: string;
};

export function renderIntegrityReport(options: IntegrityRenderOptions): string {
  const { integrityKey, ttcListHtml, userSummaryLastUpdatedDatetime, userIntegrityLastUpdatedDatetime } = options;
  const escapedKey = escapeHtml(integrityKey);

  const pageStyles = `
<style>
  ${DETAILS_CONTROL_CSS}
  ${DATATABLE_CSS}
  ${BUTTON_CSS}
  table.dataTable td, .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody>table>thead>tr>td,
  .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody>table>tbody>tr>td {
    vertical-align: top;
  }
</style>`;

  const appScript = `
<script type="text/javascript">
var user_data = undefined;
var table = undefined;
var forms = {};

${FULLSCREEN_MESSAGE_JS}

${ERROR_MESSAGE_JS}

function get_user_data() {
  if (user_data) return;
  $.get("integrity/user-integrity/get-by-user", {})
    .done(function(data) {
      user_data = JSON.parse(data);
      load_table_data();
    })
    .fail(function() {
      postErrorMessage("There was an error retrieving the integrity data.");
    });
}

function get_table_data() {
  var _selected_ttcs = $('#ttc_list').val() || [];
  var applicant_data = [];

  for (var _ae in user_data) {
    if (user_data[_ae].hasOwnProperty('ttc_application')) {
      var _applicant = user_data[_ae]['ttc_application'];
      _selected_ttcs.forEach(function(_selected_ttc) {
        if (_applicant.hasOwnProperty(_selected_ttc)) {
          var _application = _applicant[_selected_ttc];
          if ('data' in _application) {
            var _name = _application['data']['i_fname'] + ' ' + _application['data']['i_lname'];
            var enrolled_matches_count = 0;
            if ('enrolled_matches' in _applicant['${escapedKey}']) {
              for (var _me in _applicant['${escapedKey}']['enrolled_matches']) {
                if (Object.hasOwnProperty.call(_applicant['${escapedKey}']['enrolled_matches'], _me)) {
                  var _mee = _applicant['${escapedKey}']['enrolled_matches'][_me];
                  if (Array.isArray(_mee)) enrolled_matches_count += _mee.length;
                }
              }
            }
            var org_course_matches_count = 0;
            if ('org_course_matches' in _applicant['${escapedKey}']) {
              for (var _me2 in _applicant['${escapedKey}']['org_course_matches']) {
                if (Object.hasOwnProperty.call(_applicant['${escapedKey}']['org_course_matches'], _me2)) {
                  var _mee2 = _applicant['${escapedKey}']['org_course_matches'][_me2];
                  if (Array.isArray(_mee2)) org_course_matches_count += _mee2.length;
                }
              }
            }
            if (enrolled_matches_count > 0 || org_course_matches_count > 0) {
              var enrolled_people_count = Object.keys(_application['data']['i_enrolled_people'] || {}).length;
              var org_courses_count = Object.keys(_application['data']['i_org_courses'] || {}).length;
              applicant_data.push({
                name: _name, email: _ae,
                last_update_datetime: _application['last_update_datetime_est'],
                enrolled_matches_count: enrolled_matches_count + ' / ' + enrolled_people_count,
                org_course_matches_count: org_course_matches_count + ' / ' + org_courses_count,
                enrolled_matches: _applicant['${escapedKey}']['enrolled_matches'],
                org_course_matches: _applicant['${escapedKey}']['org_course_matches'],
                form_instance: _application['form_instance']
              });
            }
          }
        }
      });
    }
  }
  return applicant_data;
}

function load_table_data() {
  var applicant_data = get_table_data();
  if (table) {
    table.clear();
    table.rows.add(applicant_data);
    table.draw();
  } else {
    table = $('#${INTEGRITY_TABLE_ID}').DataTable({
      data: applicant_data,
      orderCellsTop: true,
      scrollX: true,
      iDisplayLength: 50,
      dom: 'Bfrtlip',
      buttons: ${EXPORT_BUTTONS_JS},
      columns: [
        {className:'details-control', orderable:false, data:null, defaultContent:''},
        {data:'name'}, {data:'email'}, {data:'last_update_datetime'},
        {data:'enrolled_matches_count'}, {data:'org_course_matches_count'}
      ],
      order: [[1,'asc']]
    });

    $('#${INTEGRITY_TABLE_ID} tbody').on('click', 'td.details-control', function() {
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

    // Search header
    $('#${INTEGRITY_TABLE_ID} thead tr').clone(true).appendTo('#${INTEGRITY_TABLE_ID} thead');
    $('#${INTEGRITY_TABLE_ID} thead tr:eq(1) th:not(:eq(0))').each(function(i) {
      $(this).html('<input class="table_column_search_textbox" type="textbox" placeholder="Search" />');
      $('input', this).on('keyup change', function() {
        if (table.column(i + 1).search() !== this.value) {
          table.column(i + 1).search(this.value).draw();
        }
      });
    });
  }
}

function view_form(form_type, email, form_instance) {
  $.get("reporting/user-report/get-user-application-html",
    {email:email, form_type:form_type, form_instance:form_instance})
    .done(function(data) { postFullscreenMessage(data); })
    .fail(function() { postErrorMessage("There was an error retrieving the application"); });
}

function view_form_standalone(form_type, email, form_instance) {
  window.open("reporting/user-report/get-user-application?email=" +
    encodeURIComponent(email) + "&form_type=" + encodeURIComponent(form_type) +
    "&form_instance=" + encodeURIComponent(form_instance));
}

function format(d) {
  var _tables = '';
  var _forms = [{form_type:'ttc_application', email:d.email, form_instance:d.form_instance}];

  if (d.email !== '') {
    var _enrolled_match_rows = '';
    for (var _mae in d.enrolled_matches) {
      var _matches = d.enrolled_matches[_mae];
      _enrolled_match_rows +=
        '<tr><td class="bg-white">Matched with Applicant:</td>' +
        '<td class="bg-white border-r border-gray-200">' + _mae + '</td></tr>';
      for (var i = 0; i < _matches.length; i++) {
        _enrolled_match_rows +=
          '<tr><td class="bg-white">' + (i+1) + '</td>' +
          '<td class="bg-white border-r border-gray-200">' + _matches[i] + '</td></tr>';
      }
    }
    if (_enrolled_match_rows !== '') {
      _tables += 'Enrolled Matches: <br>' +
        '<table cellpadding="5" cellspacing="0" border="0" class="border border-gray-200 bg-white p-[13px]">' +
        _enrolled_match_rows + '</table><br>';
    }

    var _course_match_rows = '';
    for (var _mae2 in d.org_course_matches) {
      var _matches2 = d.org_course_matches[_mae2];
      _course_match_rows +=
        '<tr><td class="bg-white">Matched with Applicant:</td>' +
        '<td class="bg-white border-r border-gray-200">' + _mae2 + '</td></tr>';
      for (var j = 0; j < _matches2.length; j++) {
        _course_match_rows +=
          '<tr><td class="bg-white">' + (j+1) + '</td>' +
          '<td class="bg-white border-r border-gray-200">' + _matches2[j] + '</td></tr>';
      }
    }
    if (_course_match_rows !== '') {
      _tables += 'Course matches: <br>' +
        '<table cellpadding="5" cellspacing="0" border="0" class="border border-gray-200 bg-white p-[13px]">' +
        _course_match_rows + '</table><br>';
    }
  }

  forms[d.email] = _forms;

  return _tables +
    '<div class="mt-[13px] mb-[7px]">' +
      '<a class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50" onclick="view_form_standalone(\\'ttc_application\\',\\'' + encodeURIComponent(d.email) + '\\',\\'' + encodeURIComponent(d.form_instance) + '\\');">View Application</a>&nbsp;' +
      '<a class="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50" onclick="view_form(\\'ttc_application\\',\\'' + encodeURIComponent(d.email) + '\\',\\'' + encodeURIComponent(d.form_instance) + '\\');">View Application (inline)</a>' +
    '</div>';
}

$(document).ready(function() {
  $('#ttc_list').attr('multiple', 'multiple');
  $('#ttc_list').select2();
  get_user_data();
});
</script>`;

  return `${pageStyles}
<div class="max-w-7xl mx-auto p-6 space-y-6">
  <div class="text-2xl font-light text-gray-800">
    ${escapeHtml(INTEGRITY_REPORT_TITLE)}
    <div class="text-sm text-gray-500 mt-1">
      Please see below TTC applications for country
    </div>
  </div>

  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
    ${ttcListHtml}
  </div>

  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
    <table id="${escapeHtmlAttr(INTEGRITY_TABLE_ID)}" class="display nowrap cell-border w-full">
      <thead class="font-light uppercase">
        <tr>
          <th></th>
          <th>Name</th>
          <th>Email</th>
          <th>Last Updated<br><span class="text-sm text-gray-500">(EST)</span></th>
          <th>Enrolled Matches</th>
          <th>Org Courses Matches</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th></th>
          <th colspan="5" class="text-left">Total Applications:</th>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="text-sm italic text-gray-500">
    Last updated ${escapeHtml(userIntegrityLastUpdatedDatetime)}
  </div>

  <div id="step_post_submit_message"></div>
</div>
${appScript}`;
}
