import { escapeHtml, escapeHtmlAttr } from '../../utils/html';
import {
  BUTTON_CSS,
  DATATABLE_CSS,
  DETAILS_CONTROL_CSS,
  ERROR_MESSAGE_JS,
  EXPORT_BUTTONS_JS,
  FULLSCREEN_MESSAGE_JS,
  STATUS_COLOR_JS,
  childRowClickHandlerJS,
} from '../shared/datatables-helpers';

export const ADMIN_DASHBOARD_TITLE = 'Admin';
export const ADMIN_DASHBOARD_TABLE_ID = 'ttc_applicants_summary';

export type AdminDashboardRenderOptions = {
  ttcListHtml: string;
};

/**
 * Render the TTC Applicants Summary admin page body content.
 *
 * Returns page-specific styles, HTML body, and application script.
 * The route wraps this in wrapAdminShell() which adds CDN links and base CSS.
 */
export function renderAdminDashboard(options: AdminDashboardRenderOptions): string {
  const { ttcListHtml } = options;

  const pageStyles = `
<style>
  ${DETAILS_CONTROL_CSS}
  ${DATATABLE_CSS}
  ${BUTTON_CSS}
</style>`;

  const appScript = `
<script type="text/javascript">
var applicant_summary = undefined;
var table = undefined;
var forms = {};

${STATUS_COLOR_JS}

${FULLSCREEN_MESSAGE_JS}

${ERROR_MESSAGE_JS}

function get_applicant_summary() {
  if (applicant_summary) return;
  $.get("reporting/user-summary/get-by-form-type", {})
    .done(function(data) {
      applicant_summary = JSON.parse(data);
      load_table_data();
    })
    .fail(function() {
      postErrorMessage("There was an error retrieving the summary data.");
    });
}

function get_table_data() {
  var _selected_ttcs = $('#ttc_list').val();
  if (!_selected_ttcs || _selected_ttcs.length === 0) return [];
  if (_selected_ttcs.length > 1) {
    document.getElementById('show_lifetime_yes').checked = true;
  }
  var applicant_data = [];
  var _unmapped_evaluations = [];

  _selected_ttcs.forEach(function(_selected_ttc) {
    if (applicant_summary.hasOwnProperty('ttc_application') &&
        applicant_summary['ttc_application'].hasOwnProperty(_selected_ttc)) {
      var _applications = applicant_summary['ttc_application'][_selected_ttc];
      for (var _ae in _applications) {
        if (_applications.hasOwnProperty(_ae)) {
          var _application = _applications[_ae];
          if ('data' in _application) {
            if (!_application.hasOwnProperty('evaluations')) _application['evaluations'] = [];
            if (!_application.hasOwnProperty('lifetime_evaluations')) _application['lifetime_evaluations'] = [];
            var _name = _application['data']['i_fname'] + ' ' + _application['data']['i_lname'];
            applicant_data.push({
              name: _name, email: _ae,
              cellphone: _application['data']['i_cellphone'],
              homephone: _application['data']['i_homephone'],
              city: _application['data']['i_address_city'],
              state: _application['data']['i_address_state'],
              status: _application['reporting_status'] || '',
              evals_status: _application['evaluations_reporting_status'] || '',
              evals: _application['evaluations'].length,
              lifetime_evals: _application['lifetime_evaluations'].length,
              last_update_datetime: _application['last_update_datetime_est'],
              evaluations: _application['evaluations'],
              lifetime_evaluations: _application['lifetime_evaluations'],
              form_instance: _application['form_instance']
            });
          }
        }
      }

      if (applicant_summary.hasOwnProperty('ttc_evaluation') &&
          applicant_summary['ttc_evaluation'].hasOwnProperty(_selected_ttc)) {
        var _evaluators = applicant_summary['ttc_evaluation'][_selected_ttc];
        for (var _te in _evaluators) {
          if (_evaluators.hasOwnProperty(_te)) {
            var _evaluations = _evaluators[_te];
            for (var _ve in _evaluations) {
              var _evaluation = _evaluations[_ve];
              if ('data' in _evaluation && 'is_reporting_matched' in _evaluation && _evaluation['is_reporting_matched'] == 'N') {
                var _matched_ttc_list = _evaluation['lifetime_reporting_matched_ttc_list'];
                if (_matched_ttc_list !== undefined) {
                  _matched_ttc_list = _matched_ttc_list.filter(function(n) { return _selected_ttcs.indexOf(n) !== -1; });
                }
                if (!_matched_ttc_list || _matched_ttc_list.length == 0) {
                  _unmapped_evaluations.push(_evaluation);
                }
              }
            }
          }
        }
      }
    }
  });

  if (_unmapped_evaluations.length > 0) {
    applicant_data.push({
      name: 'UNMAPPED EVALUATIONS', email: '', cellphone: '', homephone: '',
      city: '', state: '', status: '', evals_status: '',
      evals: _unmapped_evaluations.length, lifetime_evals: '',
      last_update_datetime: '', evaluations: _unmapped_evaluations,
      lifetime_evaluations: [], form_instance: ''
    });
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
    table = $('#${ADMIN_DASHBOARD_TABLE_ID}').DataTable({
      data: applicant_data,
      scrollX: true,
      colReorder: true,
      iDisplayLength: 50,
      dom: 'Bfrtlip',
      buttons: ${EXPORT_BUTTONS_JS},
      columns: [
        {className:'details-control', orderable:false, data:null, defaultContent:''},
        {data:'name'}, {data:'status'}, {data:'evals_status'},
        {data:'evals'}, {data:'lifetime_evals'}, {data:'email'},
        {data:'cellphone'}, {data:'homephone'}, {data:'city'},
        {data:'state'}, {data:'last_update_datetime'}
      ],
      order: [[1,'asc']],
      rowCallback: function(row, data) {
        $(row).find('td:eq(2)').css('color', getStatusColor(data.status));
        $(row).find('td:eq(3)').css('color', getStatusColor(data.evals_status));
      },
      footerCallback: function(tfoot, data) {
        var api = this.api();
        var summary = api.column(2).data().reduce(function(a, b) {
          if (b.toLowerCase().indexOf('complete') === 0) a.complete += 1;
          if (b.toLowerCase() === 'submitted') a.submitted += 1;
          return a;
        }, {complete:0, submitted:0});
        $(tfoot).find('th:eq(1)').html(
          'Total Complete Applications: ' + summary.complete +
          ', Total Submitted Applications: ' + summary.submitted
        );
      }
    });

    ${childRowClickHandlerJS(ADMIN_DASHBOARD_TABLE_ID)}
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

function view_form_standalone_combined(email, print_on_load) {
  var _forms = JSON.stringify(forms[email]);
  window.open("reporting/user-report/get-user-application-combined?forms=" +
    encodeURIComponent(_forms) + "&print_on_load=" + print_on_load);
}

function format(d) {
  var _rows = '';
  var _forms = [{form_type:'ttc_application', email:d.email, form_instance:d.form_instance}];

  if (d.email === '') {
    // Unmapped evaluations
    for (var i = 0; i < d.evaluations.length; i++) {
      var _e = d.evaluations[i];
      _rows +=
        '<tr>' +
          '<td style="background-color:white;">Evaluator:</td>' +
          '<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_name||'') + '</td>' +
          '<td style="background-color:white;">Email:</td>' +
          '<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_email_aol||'') + '</td>' +
          '<td style="background-color:white;">Status:</td>' +
          '<td style="background-color:white;color:' + getStatusColor(_e.reporting_status) + ';">' + (_e.reporting_status||'') + '</td>' +
          '<td style="background-color:white;"><a class="an-simple-button" onclick="view_form_standalone(\'ttc_evaluation\',\'' + (_e.email||'') + '\',\'' + (_e.form_instance||'') + '\');">View</a></td>' +
        '</tr>' +
        '<tr>' +
          '<td style="background-color:white;">Volunteer:</td>' +
          '<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_volunteer_name||'') + '</td>' +
          '<td style="background-color:white;">Email:</td>' +
          '<td style="background-color:white;border-right:1px solid #eee;">' + (_e.data.i_volunteer_email||'') + '</td>' +
          '<td style="background-color:white;"></td><td style="background-color:white;"></td><td style="background-color:white;"></td>' +
        '</tr>';
      if (i === d.evaluations.length - 1) {
        _rows += '<tr><td style="background-color:#fafafa;line-height:5px;" colspan="7"></td></tr>';
      }
    }
  } else {
    var _show_lifetime = $('input[name=show_lifetime]:checked').val();
    var _evaluations = (_show_lifetime === 'yes') ? d.lifetime_evaluations : d.evaluations;
    for (var j = 0; j < _evaluations.length; j++) {
      var _ev = _evaluations[j];
      var _ttc_dates = '';
      if (_show_lifetime === 'yes') {
        var _display = '';
        if (_ev.ttc_metadata) { _display = _ev.ttc_metadata.display; }
        else { _display = _ev.data.dates || _ev.data.Dates || (_ev.data.i_ttc_country_and_dates||'').toUpperCase(); }
        _ttc_dates = '<td style="background-color:white;">TTC:</td>' +
          '<td style="background-color:white;border-right:1px solid #eee;">' + _display + '</td>';
      }
      _rows +=
        '<tr>' + _ttc_dates +
          '<td style="background-color:white;">Evaluator:</td>' +
          '<td style="background-color:white;border-right:1px solid #eee;">' + (_ev.data.i_name||'') + '</td>' +
          '<td style="background-color:white;">Email:</td>' +
          '<td style="background-color:white;border-right:1px solid #eee;">' + (_ev.data.i_email_aol||_ev.email||'') + '</td>' +
          '<td style="background-color:white;">Status:</td>' +
          '<td style="background-color:white;color:' + getStatusColor(_ev.reporting_status) + ';">' + (_ev.reporting_status||'') + '</td>' +
          '<td style="background-color:white;"><a class="an-simple-button" onclick="view_form_standalone(\'ttc_evaluation\',\'' + (_ev.email||'') + '\',\'' + (_ev.form_instance||'') + '\');">View</a></td>' +
        '</tr>';
      _forms.push({form_type:'ttc_evaluation', email:_ev.email, form_instance:_ev.form_instance});
    }
  }

  forms[d.email] = _forms;

  return '<table cellpadding="5" cellspacing="0" border="0" style="padding:0 13px;border:1px solid #eee;background-color:white;">' +
    _rows + '</table>' +
    '<div style="margin-top:13px;margin-bottom:7px;">' +
      '<a class="an-simple-button" onclick="view_form_standalone_combined(\'' + d.email + '\',\'Y\');">Print</a>&nbsp;' +
      '<a class="an-simple-button" onclick="view_form_standalone_combined(\'' + d.email + '\',\'N\');">View with evaluations (new window)</a>&nbsp;' +
      '<a class="an-simple-button" onclick="view_form(\'ttc_application\',\'' + d.email + '\',\'' + d.form_instance + '\');">View Application</a>&nbsp;' +
      '<a class="an-simple-button" onclick="view_form_standalone(\'ttc_application\',\'' + d.email + '\',\'' + d.form_instance + '\');">View Application (new window)</a>' +
    '</div>';
}

$(document).ready(function() {
  $('#ttc_list').attr('multiple', 'multiple');
  $('#ttc_list').select2();
  get_applicant_summary();
});
</script>`;

  const ttcListSection = ttcListHtml;

  return `${pageStyles}
<div class="site-container">
  <div class="form-header-block" style="text-align:left;">
    ${escapeHtml(ADMIN_DASHBOARD_TITLE)}
    <div class="smallertext" style="margin-top:7px;">
      Please see below TTC applications for country
    </div>
  </div>

  ${ttcListSection}

  <div style="margin-top:35px;margin-bottom:23px;">
    <label for="show_lifetime_yes">Show lifetime evaluations?</label>
    <span class="smallertext">Show evaluations from other TTCs as well. This is helpful if the teacher submitted evaluations using another TTC</span>
    <div style="margin-top:8px;">
      <form autocomplete="off">
        <input type="radio" onchange="load_table_data()" id="show_lifetime_yes" name="show_lifetime" value="yes" required>&nbsp;<label for="show_lifetime_yes">Yes</label>
        <input type="radio" onchange="load_table_data()" id="show_lifetime_no" name="show_lifetime" value="no" required checked>&nbsp;<label for="show_lifetime_no">No</label>
      </form>
    </div>
  </div>

  <table id="${escapeHtmlAttr(ADMIN_DASHBOARD_TABLE_ID)}" class="display nowrap" style="width:100%;">
    <thead style="font-family:Ubuntu;font-weight:300;text-transform:uppercase;">
      <tr>
        <th></th>
        <th>Name</th>
        <th>Status</th>
        <th>Evals Status</th>
        <th>Evals</th>
        <th>Evals (Lifetime)</th>
        <th>Email</th>
        <th>Cell Phone</th>
        <th>Home Phone</th>
        <th>City</th>
        <th>State</th>
        <th>Last Updated (EST)</th>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <th></th>
        <th colspan="11" style="text-align:left;">Total Complete Applications: <i style="font-weight:normal;">loading</i>, Total Submitted Applications: <i style="font-weight:normal;">loading</i></th>
      </tr>
    </tfoot>
  </table>

  <div id="step_post_submit_message"></div>
</div>
${appScript}`;
}
