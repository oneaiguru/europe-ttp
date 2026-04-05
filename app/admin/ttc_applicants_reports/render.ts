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

export const REPORTS_TITLE = 'Admin: TTC Report';
export const REPORTS_TABLE_ID = 'ttc_applicants_summary';

export type ReportsRenderOptions = {
  reportingKey: string;
  ttcCountryAndDates: string;
  ttcListHtml: string;
};

export const REPORTS_EXTRA_HEAD_CSS = `<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css">`;
export const REPORTS_EXTRA_CDN_JS = `<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>`;

export function renderReports(options: ReportsRenderOptions): string {
  const { reportingKey, ttcCountryAndDates, ttcListHtml } = options;
  const rk = escapeHtml(reportingKey);

  const pageStyles = `
<style>
  ${DETAILS_CONTROL_CSS}
  ${DATATABLE_CSS}
  ${BUTTON_CSS}
  table.dataTable td, .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody>table>thead>tr>td,
  .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody>table>tbody>tr>td {
    vertical-align: top;
  }
  .table_column_search_textbox { width: 100%; box-sizing: border-box; }
  .display_only_text { border: none; background: transparent; font-size: 13px; }
</style>`;

  const appScript = `
<script type="text/javascript">
var ttc_country_and_dates = ${ttcCountryAndDates};
var user_data = undefined;
var table = undefined;
var forms = {};
var count_lo = 0;
var count_hi = 100;

${STATUS_COLOR_JS}

${FULLSCREEN_MESSAGE_JS}

${ERROR_MESSAGE_JS}

function isEmpty(v) { return v === undefined || v === null || v === ''; }

function dict2bullets(d) {
  if (!d || typeof d !== 'object') return '';
  var items = [];
  for (var k in d) {
    if (d.hasOwnProperty(k)) items.push(k + ': ' + d[k]);
  }
  return items.length > 0 ? '<ul class="mt-0 pl-4"><li>' + items.join('</li><li>') + '</li></ul>' : '';
}

function array2bullets(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
  return '<ul class="mt-0 pl-4"><li>' + arr.join('</li><li>') + '</li></ul>';
}

function calculateAge(dob) {
  if (!dob) return '';
  var d = new Date(dob);
  if (isNaN(d.getTime())) return '';
  var today = new Date();
  var age = today.getFullYear() - d.getFullYear();
  var m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function getShowHideHTML(data, idx, maxLen, showLabel, hideLabel, startCollapsed) {
  if (!data || typeof data !== 'string' || !maxLen) return data || '';
  if (data.length <= maxLen) return data;
  showLabel = showLabel || '[+]';
  hideLabel = hideLabel || '[-]';
  var short = data.substring(0, maxLen);
  if (startCollapsed) {
    return '<span id="short' + idx + '">' + short + ' <a onclick="document.getElementById(\\'short' + idx + '\\').classList.add(\\'hidden\\');document.getElementById(\\'full' + idx + '\\').classList.remove(\\'hidden\\');">' + showLabel + '</a></span>' +
      '<span id="full' + idx + '" class="hidden">' + data + ' <a onclick="document.getElementById(\\'full' + idx + '\\').classList.add(\\'hidden\\');document.getElementById(\\'short' + idx + '\\').classList.remove(\\'hidden\\');">' + hideLabel + '</a></span>';
  }
  return data;
}

function hideAllChildren(tr) {}
function showAllChildren(tr) {}

function get_user_data() {
  if (user_data) return;
  $.get("reporting/user-summary/get-by-user", {})
    .done(function(data) {
      user_data = JSON.parse(data);
      load_table_data();
    })
    .fail(function() {
      postErrorMessage("There was an error retrieving the report data.");
    });
}

function report_filter(_applicant, _application, _report, _show_lifetime) {
  if (_report === '') return true;
  if (_report === 'intros_organized') {
    return _application.hasOwnProperty('data') &&
      _application['data'].hasOwnProperty('i_last1year_introtalks') &&
      !isNaN(_application['data']['i_last1year_introtalks']) &&
      parseInt(_application['data']['i_last1year_introtalks']) >= parseInt(count_lo) &&
      parseInt(_application['data']['i_last1year_introtalks']) <= parseInt(count_hi);
  }
  if (_report === 'enrollments_mentioned') {
    return _application.hasOwnProperty('data') &&
      _application['data'].hasOwnProperty('i_enrollment') &&
      !isNaN(_application['data']['i_enrollment']) &&
      parseInt(_application['data']['i_enrollment']) >= parseInt(count_lo) &&
      parseInt(_application['data']['i_enrollment']) <= parseInt(count_hi);
  }
  if (_report === 'enrollments_list_count') {
    return _application['${rk}'].hasOwnProperty('enrolled_people_count') &&
      parseInt(_application['${rk}']['enrolled_people_count']) >= parseInt(count_lo) &&
      parseInt(_application['${rk}']['enrolled_people_count']) <= parseInt(count_hi);
  }
  if (_report === 'only_kids_courses') {
    return _application.hasOwnProperty('data') &&
      _application['data'].hasOwnProperty('i_course_wishlist_yp') &&
      _application['data']['i_course_wishlist_yp'] === false &&
      _application['data'].hasOwnProperty('i_course_wishlist_hp') &&
      _application['data']['i_course_wishlist_hp'] === false &&
      ((_application['data'].hasOwnProperty('i_course_wishlist_yes') && _application['data']['i_course_wishlist_yes'] === true) ||
       (_application['data'].hasOwnProperty('i_course_wishlist_artexcel') && _application['data']['i_course_wishlist_artexcel'] === true));
  }
  if (_report === 'no_prereq') {
    return _application['${rk}']['prereq_no_count'] > 0;
  }
  if (_report === 'not_ready' && !_show_lifetime) {
    return _application['${rk}']['eval_teaching_readiness_not_ready_now_count'] > 0;
  }
  if (_report === 'not_ready' && _show_lifetime) {
    return _applicant['${rk}']['lifetime_eval_teaching_readiness_not_ready_now_count'] > 0;
  }
  if (_report === 'less_than_3_rating' && !_show_lifetime) {
    return _application['${rk}']['evaluator_ratings_below_3'] > 0;
  }
  if (_report === 'less_than_3_rating' && _show_lifetime) {
    return _applicant['${rk}']['lifetime_evaluator_ratings_below_3'] > 0;
  }
  if (_report === 'no_of_courses_org') {
    return _application['${rk}'].hasOwnProperty('org_courses_count') &&
      _application['${rk}']['org_courses_count'] >= parseInt(count_lo) &&
      _application['${rk}']['org_courses_count'] <= parseInt(count_hi);
  }
  if (_report === 'late_vtp_30') {
    return _application['${rk}'].hasOwnProperty('prettc_date_to_deadline_days') &&
      !isEmpty(_application['${rk}']['prettc_date_to_deadline_days']) &&
      _application['${rk}']['prettc_date_to_deadline_days'] < 30;
  }
  if (_report === 'late_vtp_90') {
    return _application['${rk}'].hasOwnProperty('prettc_date_to_deadline_days') &&
      !isEmpty(_application['${rk}']['prettc_date_to_deadline_days']) &&
      _application['${rk}']['prettc_date_to_deadline_days'] < 90;
  }
  return false;
}

function get_table_data() {
  var _selected_ttcs = $('#ttc_list').val();
  if (_selected_ttcs.length > 1) {
    document.getElementById('show_lifetime_yes').checked = true;
  }
  var _show_lifetime = $('input[name=show_lifetime]:checked').val() !== 'no';
  var _selected_report = document.getElementById('select_report').value;

  var applicant_data = [];
  var _unmapped_evaluations = [];

  for (var _ae in user_data) {
    if (user_data[_ae].hasOwnProperty('ttc_application')) {
      var _applicant = user_data[_ae]['ttc_application'];
      _selected_ttcs.forEach(function(_selected_ttc) {
        if (_applicant.hasOwnProperty(_selected_ttc)) {
          var _application = _applicant[_selected_ttc];
          if ('data' in _application) {
            var _name = _application['data']['i_fname'] + ' ' + _application['data']['i_lname'];
            var _user_ttc = _application['form_instance_page_data']['i_ttc_country_and_dates'];
            var _prettc_date_str = _application['data']['i_prettc_date'];
            var _prettc_date_to_deadline_days = null;
            for (var i = 0; i < ttc_country_and_dates.length && _prettc_date_str && _prettc_date_str.trim().length === 7; i++) {
              var t = ttc_country_and_dates[i];
              if (t['value'] === _user_ttc) {
                try {
                  var _ttc_deadline = new Date(t['display_until']);
                  var _prettc_date = new Date(_prettc_date_str.substring(0,3) + '01/' + _prettc_date_str.substring(3));
                  _prettc_date_to_deadline_days = Math.round(Math.abs(_ttc_deadline - _prettc_date) / (1000*60*60*24)).toString();
                } catch(e) { _prettc_date_to_deadline_days = null; }
              }
            }
            _application['${rk}']['prettc_date_to_deadline_days'] = _prettc_date_to_deadline_days;

            if (report_filter(_applicant, _application, _selected_report, _show_lifetime)) {
              var _age = calculateAge(_application['data']['i_date_of_birth']);
              var _show_lifetime_val = $('input[name=show_lifetime]:checked');
              var _evaluator_names = [];
              var _eval_volunteer_mental_fitness = [];
              var _eval_teaching_readiness, _evaluator_ratings_below_3;

              var _evaluations = [];
              for (var _t in _application['${rk}']['evaluations']) {
                for (var _ae2 in _application['${rk}']['evaluations'][_t]) {
                  var _evaluation = user_data[_t]['ttc_evaluation'][_selected_ttc][_ae2];
                  _evaluations.push(_evaluation);
                }
              }
              var _lifetime_evaluations = [];
              for (var _fi in _applicant['${rk}']['lifetime_evaluations']) {
                for (var _t2 in _applicant['${rk}']['lifetime_evaluations'][_fi]) {
                  for (var _ae3 in _applicant['${rk}']['lifetime_evaluations'][_fi][_t2]) {
                    var _evaluation2 = user_data[_t2]['ttc_evaluation'][_fi][_ae3];
                    _lifetime_evaluations.push(_evaluation2);
                  }
                }
              }

              if (_show_lifetime_val.val() === 'no') {
                for (var j = 0; j < _evaluations.length; j++) {
                  _evaluator_names.push(_evaluations[j].data.i_name);
                  _eval_volunteer_mental_fitness.push(_evaluations[j].data.i_volunteer_mental_fitness);
                }
                _eval_teaching_readiness = _application['${rk}']['eval_teaching_readiness'] || {};
                _evaluator_ratings_below_3 = _application['${rk}']['evaluator_ratings_below_3'] || '';
              } else {
                for (var k = 0; k < _lifetime_evaluations.length; k++) {
                  _evaluator_names.push(_lifetime_evaluations[k].data.i_name);
                  _eval_volunteer_mental_fitness.push(_lifetime_evaluations[k].data.i_volunteer_mental_fitness);
                }
                _eval_teaching_readiness = _applicant['${rk}']['lifetime_eval_teaching_readiness'] || {};
                _evaluator_ratings_below_3 = _applicant['${rk}']['lifetime_evaluator_ratings_below_3'] || '';
              }

              applicant_data.push({
                name: _name, email: _ae,
                status: _application['${rk}']['reporting_status'],
                evals: _evaluations.length,
                lifetime_evals: _lifetime_evaluations.length,
                last_update_datetime: _application['last_update_datetime_est'],
                age: _age || '', gender: _application['data']['i_gender'] || '',
                cellphone: _application['data']['i_cellphone'] || '',
                homephone: _application['data']['i_homephone'] || '',
                city: _application['data']['i_address_city'] || '',
                state: _application['data']['i_address_state'] || '',
                enrollment_count: _application['data']['i_enrollment'],
                enrollment_list_count: _application['${rk}']['enrolled_people_count'] || '0',
                prereq_no_count: _application['${rk}']['prereq_no_count'] || '0',
                eval_teaching_readiness: dict2bullets(_eval_teaching_readiness),
                evaluator_ratings_below_3: _evaluator_ratings_below_3 || '0',
                org_courses_count: _application['${rk}']['org_courses_count'] || '0',
                course_organized_count: _application['data']['i_course_organized_count'] || '',
                course_assisted_count: _application['data']['i_course_assisted_count'] || '',
                intro_talk_count: _application['data']['i_last1year_introtalks'] || '',
                prettc_teacher: _application['data']['i_prettc_teacher'] || '',
                prettc_date: _application['data']['i_prettc_date'] || '',
                prettc_date_to_deadline_days: _prettc_date_to_deadline_days,
                prettc_location: _application['data']['i_prettc_location'] || '',
                youthteacher: _application['data']['i_youthteacher'] || '',
                course_wishlist: array2bullets(_application['data']['i_course_wishlist'] || []),
                special_interest_groups: array2bullets(_application['data']['i_special_interest_groups'] || []),
                evaluator_names: array2bullets(_evaluator_names),
                eval_volunteer_mental_fitness: array2bullets(_eval_volunteer_mental_fitness),
                evaluations: _evaluations,
                lifetime_evaluations: _lifetime_evaluations,
                form_instance: _application['form_instance']
              });
            }
          }
        }
      });
    }

    if (user_data[_ae].hasOwnProperty('ttc_evaluation')) {
      var _evaluator = user_data[_ae]['ttc_evaluation'];
      _selected_ttcs.forEach(function(_selected_ttc) {
        if (_evaluator.hasOwnProperty(_selected_ttc)) {
          for (var _ve in _evaluator[_selected_ttc]) {
            var _eval = _evaluator[_selected_ttc][_ve];
            if ('[Reporting.KEY]' in _eval && 'is_reporting_matched' in _eval['[Reporting.KEY]'] && _eval['[Reporting.KEY]']['is_reporting_matched'] === 'N') {
              var _matched_ttc_list = _eval['lifetime_reporting_matched_ttc_list'];
              if (_matched_ttc_list !== undefined) {
                _matched_ttc_list = _matched_ttc_list.filter(function(n) { return _selected_ttcs.indexOf(n) !== -1; });
              }
              if (!_matched_ttc_list || _matched_ttc_list.length === 0) {
                _unmapped_evaluations.push(_eval);
              }
            }
          }
        }
      });
    }
  }

  if (_unmapped_evaluations.length > 0) {
    applicant_data.push({
      name:'UNMAPPED EVALUATIONS', email:'', status:'', evals:'', lifetime_evals:'',
      last_update_datetime:'', age:'', gender:'', cellphone:'', homephone:'',
      city:'', state:'', enrollment_count:'', enrollment_list_count:'',
      prereq_no_count:'', eval_teaching_readiness:'', evaluator_ratings_below_3:'',
      org_courses_count:'', course_organized_count:'', course_assisted_count:'',
      intro_talk_count:'', prettc_teacher:'', prettc_date:'',
      prettc_date_to_deadline_days:'', prettc_location:'', youthteacher:'',
      course_wishlist:'', special_interest_groups:'', evaluator_names:'',
      eval_volunteer_mental_fitness:'',
      evaluations:_unmapped_evaluations, lifetime_evaluations:[], form_instance:''
    });
  }
  return applicant_data;
}

function show_report() {
  var _selected_report = document.getElementById('select_report').value;
  if (_selected_report === 'no_of_courses_org' || _selected_report === 'intros_organized' ||
      _selected_report === 'enrollments_mentioned' || _selected_report === 'enrollments_list_count') {
    $("[name='count_slider_section']").show();
  } else {
    $("[name='count_slider_section']").hide();
  }
  load_table_data();
}

function load_table_data() {
  var applicant_data = get_table_data();
  if (table) {
    table.clear();
    table.rows.add(applicant_data);
    table.draw();
  } else {
    table = $('#${REPORTS_TABLE_ID}').DataTable({
      data: applicant_data,
      orderCellsTop: true,
      scrollX: true,
      iDisplayLength: 50,
      dom: 'Bfrtlip',
      buttons: ${EXPORT_BUTTONS_JS},
      columns: [
        {className:'details-control', orderable:false, data:null, defaultContent:''},
        {data:'name'}, {data:'email'}, {data:'status'}, {data:'last_update_datetime'},
        {data:'evals'}, {data:'lifetime_evals'}, {data:'evaluator_names'},
        {data:'eval_teaching_readiness'}, {data:'evaluator_ratings_below_3'},
        {data:'eval_volunteer_mental_fitness'},
        {data:'age'}, {data:'gender'}, {data:'cellphone'}, {data:'homephone'},
        {data:'city'}, {data:'state'},
        {data:'org_courses_count'}, {data:'course_organized_count'}, {data:'course_assisted_count'},
        {data:'intro_talk_count'}, {data:'enrollment_count'}, {data:'enrollment_list_count'},
        {data:'prereq_no_count'},
        {data:'prettc_teacher'}, {data:'prettc_date'}, {data:'prettc_date_to_deadline_days'},
        {data:'prettc_location'}, {data:'youthteacher'},
        {data:'course_wishlist'}, {data:'special_interest_groups'}
      ],
      columnDefs: [
        { render: function(data) { return data; }, targets: [0,1,2,3,4,5,6] },
        {
          render: function(data, type, row, meta) {
            var idx = '-' + meta.row + '-' + meta.col;
            var _view_mode = $('input[name=view_mode]:checked');
        var _content;
        if (_view_mode.val() === 'c') {
          _content = getShowHideHTML(data, idx, 19, '[+]', '[-]', true);
        } else {
          _content = getShowHideHTML(data, idx);
        }
        return "<div class='whitespace-normal max-w-[200px]'>" + _content + "</div>";
      },
      targets: '_all'
    }
      ],
      order: [[1,'asc']],
      rowCallback: function(row, data) {
        $(row).find('td:eq(3)').css('color', getStatusColor(data.status));
      },
      footerCallback: function(tfoot) {
        var api = this.api();
        var submitted = api.column(3).data().reduce(function(a, b) {
          if (b === 'submitted' || b === 'complete') a += 1;
          return a;
        }, 0);
        $(tfoot).find('th:eq(1)').html('Total Submitted Applications: ' + submitted);
      }
    });

    $('#${REPORTS_TABLE_ID} tbody').on('click', 'td.details-control', function() {
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
    $('#${REPORTS_TABLE_ID} thead tr').clone(true).appendTo('#${REPORTS_TABLE_ID} thead');
    $('#${REPORTS_TABLE_ID} thead tr:eq(1) th:not(:eq(0))').each(function(i) {
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

function save_ttcdesk_data(form_type, email, form_instance) {
  var comment = $('#local_ttcdesk_comments-' + email + '-' + form_instance).val();
  $.post("/users/upload-ttcdesk-data", {
    email: email, form_type: form_type, form_instance: form_instance,
    ttcdesk_data: JSON.stringify({comment: comment})
  })
    .done(function(data) { postFullscreenMessage(data); })
    .fail(function() { postErrorMessage("There was an error saving the comments"); });
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
    for (var i = 0; i < d.evaluations.length; i++) {
      var _e = d.evaluations[i];
      _rows +=
        '<tr>' +
          '<td class="bg-white">Evaluator:</td>' +
          '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_name||'') + '</td>' +
          '<td class="bg-white">Email:</td>' +
          '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_email_aol||'') + '</td>' +
          '<td class="bg-white">Status:</td>' +
          '<td style="background-color:white;color:' + getStatusColor(_e['${rk}'].reporting_status) + ';">' + _e['${rk}'].reporting_status + '</td>' +
          '<td class="bg-white"><a class="an-simple-button" onclick="view_form_standalone(\\'ttc_evaluation\\',\\'' + encodeURIComponent(_e.email) + '\\',\\'' + encodeURIComponent(_e.form_instance) + '\\');">View</a></td>' +
        '</tr>' +
        '<tr>' +
          '<td class="bg-white">Volunteer:</td>' +
          '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_volunteer_name||'') + '</td>' +
          '<td class="bg-white">Email:</td>' +
          '<td class="bg-white border-r border-[#eee]">' + (_e.data.i_volunteer_email||'') + '</td>' +
          '<td class="bg-white"></td><td class="bg-white"></td><td class="bg-white"></td>' +
        '</tr>';
      if (i === d.evaluations.length - 1) {
        _rows += '<tr><td class="bg-[#fafafa] leading-[5px]" colspan="7"></td></tr>';
      }
    }
  } else {
    var _show_lifetime = $('input[name=show_lifetime]:checked');
    var _evaluations = (_show_lifetime.val() === 'no') ? d.evaluations : d.lifetime_evaluations;
    for (var j = 0; j < _evaluations.length; j++) {
      var _ev = _evaluations[j];
      var _ttc_dates = '';
      if (_show_lifetime.val() === 'yes') {
        var _display = '';
        if (_ev.ttc_metadata) { _display = _ev.ttc_metadata.display; }
        else { _display = _ev.data.dates || _ev.data.Dates || (_ev.data.i_ttc_country_and_dates||'').toUpperCase(); }
        _ttc_dates = '<td class="bg-white">TTC:</td>' +
          '<td class="bg-white border-r border-[#eee]">' + _display + '</td>';
      }
      _rows +=
        '<tr>' + _ttc_dates +
          '<td class="bg-white">Evaluator:</td>' +
          '<td class="bg-white border-r border-[#eee]">' + (_ev.data.i_name||'') + '</td>' +
          '<td class="bg-white">Email:</td>' +
          '<td class="bg-white border-r border-[#eee]">' + (_ev.data.i_email_aol||_ev.email||'') + '</td>' +
          '<td class="bg-white">Status:</td>' +
          '<td style="background-color:white;color:' + getStatusColor(_ev['${rk}'].reporting_status) + ';">' + _ev['${rk}'].reporting_status + '</td>' +
          '<td class="bg-white"><a class="an-simple-button" onclick="view_form_standalone(\\'ttc_evaluation\\',\\'' + encodeURIComponent(_ev.email) + '\\',\\'' + encodeURIComponent(_ev.form_instance) + '\\');">View</a></td>' +
        '</tr>';
      _forms.push({form_type:'ttc_evaluation', email:_ev.email, form_instance:_ev.form_instance});
    }
  }

  forms[d.email] = _forms;

  return '<table cellpadding="5" cellspacing="0" border="0" class="p-[0_13px] border border-[#eee] bg-white">' +
    _rows + '</table>' +
    '<div class="mt-[13px] mb-[7px]">' +
      '<a class="an-simple-button" onclick="view_form_standalone_combined(\\'' + encodeURIComponent(d.email) + '\\',\\'Y\\');">Print</a>&nbsp;' +
      '<a class="an-simple-button" onclick="view_form_standalone_combined(\\'' + encodeURIComponent(d.email) + '\\',\\'N\\');">View with evaluations (new window)</a>&nbsp;' +
      '<a class="an-simple-button" onclick="view_form(\\'ttc_application\\',\\'' + encodeURIComponent(d.email) + '\\',\\'' + encodeURIComponent(d.form_instance) + '\\');">View Application</a>&nbsp;' +
      '<a class="an-simple-button" onclick="view_form_standalone(\\'ttc_application\\',\\'' + encodeURIComponent(d.email) + '\\',\\'' + encodeURIComponent(d.form_instance) + '\\');">View Application (new window)</a>&nbsp;' +
      '<a class="an-simple-button" onclick="save_ttcdesk_data(\\'ttc_application\\',\\'' + encodeURIComponent(d.email) + '\\',\\'' + encodeURIComponent(d.form_instance) + '\\');">Save Comments</a>&nbsp;' +
      '<textarea id="local_ttcdesk_comments-' + d.email + '-' + d.form_instance + '" rows="2" cols="40" placeholder="Comments"></textarea>' +
    '</div>';
}

$(document).ready(function() {
  $('#ttc_list').attr('multiple', 'multiple');
  $('#ttc_list').select2();

  $(function() {
    $("#count_slider").slider({
      range: true, min: 0, max: 100, values: [0, 100],
      slide: function(event, ui) {
        $("#i_count").val("Between " + ui.values[0] + " to " + ui.values[1]);
        count_lo = parseInt(ui.values[0]);
        count_hi = parseInt(ui.values[1]);
        load_table_data();
      }
    });
    $("#i_count").val("Between 0 to 100");
    $("[name='count_slider_section']").hide();
  });

  get_user_data();
});
</script>`;

  return `${pageStyles}
<div class="max-w-7xl mx-auto p-6 space-y-6">
  <div class="form-header-block text-2xl font-light text-gray-800">
    ${escapeHtml(REPORTS_TITLE)}
    <div class="smallertext mt-2">
      Please see below TTC applications for country
    </div>
  </div>

  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
    ${ttcListHtml}

    <div class="mt-8 mb-6">
      <label for="show_lifetime_yes">Show lifetime evaluations?</label>
      <span class="smallertext">Show evaluations from other TTCs as well. This is helpful if the teacher submitted evaluations using another TTC</span>
      <div class="mt-2">
        <form autocomplete="off">
          <input type="radio" onchange="load_table_data()" id="show_lifetime_yes" name="show_lifetime" value="yes" required checked>&nbsp;<label for="show_lifetime_yes">Yes</label>
          <input type="radio" onchange="load_table_data()" id="show_lifetime_no" name="show_lifetime" value="no" required>&nbsp;<label for="show_lifetime_no">No</label>
        </form>
      </div>
    </div>

    <div class="mb-6">
      <label for="select_report">Report</label>
      <span class="smallertext">Select the report from the dropdown</span>
      <div class="mt-2">
        <select onchange="show_report()" class="textbox w-full max-w-[600px]" id="select_report">
          <option value="">Show All</option>
          <option value="no_prereq">1. Answered "No" for any of the pre-requisites</option>
          <option value="not_ready">2. Evaluators answered anything other than "Ready Now" for teaching readiness</option>
          <option value="less_than_3_rating">3. Evaluators rated them less than 3 on any category</option>
          <option value="no_of_courses_org">4. Filter based on # of courses Organized and Assisted</option>
          <option value="late_vtp_30">5. Attended VTP date less than 1 month from Application deadline</option>
          <option value="late_vtp_90">6. Attended VTP date less than 3 months from Application deadline</option>
          <option value="only_kids_courses">7. Only applied for Kids courses</option>
          <option value="intros_organized">8. Number of intro talks organized</option>
          <option value="enrollments_mentioned">9. Number of enrolled people</option>
          <option value="enrollments_list_count">10. Number of enrolled people listed</option>
        </select>
      </div>
      <div name="count_slider_section" class="mt-[13px]">
        <input type="text" id="i_count" readonly class="display_only_text max-w-[210px] mb-[13px]" />
        <div id="count_slider" class="max-w-[210px]"></div>
      </div>
    </div>

    <div class="mb-2 smallertext">
      <label for="view_mode_compact">View Mode:</label>&nbsp;
      <input type="radio" onchange="load_table_data()" id="view_mode_compact" name="view_mode" value="c" required>&nbsp;<label for="view_mode_compact">Compact</label>
      <input type="radio" onchange="load_table_data()" id="view_mode_expanded" name="view_mode" value="x" required checked>&nbsp;<label for="view_mode_expanded">Expanded</label>
    </div>
  </div>

  <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
    <table id="${escapeHtmlAttr(REPORTS_TABLE_ID)}" class="display nowrap cell-border w-full">
      <thead class="font-light uppercase">
        <tr>
          <th></th>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Last Updated<br><span class="smallertext">(EST)</span></th>
          <th>Evals</th>
          <th>Evals<br><span class="smallertext">(lifetime)</span></th>
          <th>Evaluators</th>
          <th>Eval: Teaching Readiness</th>
          <th>Eval: Ratings below 3 (Evals)</th>
          <th>Eval: Mental Fitness</th>
          <th>Age</th>
          <th>Gender</th>
          <th>Cell Phone</th>
          <th>Home Phone</th>
          <th>City</th>
          <th>State</th>
          <th># courses listed</th>
          <th># courses organized<br><span class="smallertext">(last 2 years)</span></th>
          <th># courses assisted<br><span class="smallertext">(last 2 years)</span></th>
          <th># intro talks<br><span class="smallertext">(last 1 year)</span></th>
          <th>Enrollment</th>
          <th>Enrollment<br><span class="smallertext">(listed names)</span></th>
          <th># "No" Pre-Requisites</th>
          <th>VTP teacher</th>
          <th>VTP date</th>
          <th>VTP days<br><span class="smallertext">(till application deadline)</span></th>
          <th>VTP location</th>
          <th>Youthteacher</th>
          <th>Course wishlist</th>
          <th>Special interest groups</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th></th>
          <th colspan="30" class="text-left">Total Submitted Applications:</th>
        </tr>
      </tfoot>
    </table>
  </div>

  <div id="step_post_submit_message"></div>
</div>
${appScript}`;
}
