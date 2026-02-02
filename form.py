# import webapp2
import os
import urllib
import unicodedata
import logging
import base64
import hashlib
import json
from datetime import tzinfo, timedelta, datetime

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import app_identity
from google.appengine.api import mail

import jinja2
import webapp2

import cloudstorage as gcs

import constants
import ttc_portal_user
from pyutils import dt_utils

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

#[START Form]
class Form(webapp2.RequestHandler):

    # [START get_html_for_question] 
    def get_html_for_question(self, question, user_home_country=None, is_user_whitelisted='N'):
        _current_datetime_est = int(dt_utils.utc_to_timezone(datetime.today(), dt_utils.Eastern).strftime("%Y%m%d%H%M%S"))
        _current_datetime_minus_30d_est = int(dt_utils.utc_to_timezone((datetime.today() - timedelta(days=30)), dt_utils.Eastern).strftime("%Y%m%d%H%M%S"))
        q_type = question["type"]
        q_id = question.get("id","")
        q_is_form_instance_identifier = question.get('is_form_instance_identifier',"false")
        q_is_required = question.get('required',True)
        q_required = 'required' if q_is_required == True else ''
        logging.info('[get_html_for_question] question_id = ' + q_id)
        html = ""
        javascript = ""
        dep_list = {}
        repeat_question_list = {}
        if q_type == "question" or q_type == "general":
            html = """
                <div class="tablerow">
                    <div name="{id}" class="tablecell">
                        <div id="{id}" class="colspanhack">
                            {question}
                            <span class="smallertext">{helper}</span>
                        </div>
                    </div>
                    <div name="{id}" class="tablecell">
                        &nbsp;
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question.get("question", question.get("display_value")),
                helper=question.get("helper", ""),
                is_form_instance_identifier=q_is_form_instance_identifier,
            )
        elif q_type == "header":
            html = """
                <div class="tablerow">
                    <div class="tablecell">
                        <div class="colspanhack">
                            <br>
                            <div class="titletext">
                                {question}
                            </div>
                            <span class="smallertext">{helper}</span>
                            <hr class='silver-hr'>
                        </div>
                    </div>
                </div>
            """.format(
                question=question["display_value"],
                helper=question.get("helper", ""),
                is_form_instance_identifier=q_is_form_instance_identifier,
            )
        elif q_type == "text" or q_type == "email":
            if q_id == 'i_country' or q_id == 'i_ttc_country' or q_id == "i_address_country":
                # Special handling for country to allow for dropdown
                html = """
                    <div name="{id}" class="tablerow">
                        <div class="tablecell">
                            <label name="{id}" for="{id}">{question}</label>
                            <span class="smallertext">{helper}</span>
                        </div>
                        <div class="tablecell">
                            <div id="i_country_dropdown">
                                <input id="i_country" class="typeahead" type="text" placeholder="Enter Country" autocomplete="off">
                                <input id="i_country_iso_abbr" type="hidden" value="{{{{ user_country }}}}" is-form-instance-identifier="{is_form_instance_identifier}" autocomplete="off">
                            </div>
                        </div>
                    </div>
                """.format(
                    id=q_id,
                    question=question["question"],
                    helper=question.get("helper", ""),
                    default_value=question.get("default_value", ""),
                    placeholder_value=question.get("placeholder_value", ""),
                    is_form_instance_identifier=q_is_form_instance_identifier,
                )
            elif q_type == "email":
                html = """
                    <div name="{id}" class="tablerow">
                        <div class="tablecell">
                            <label name="{id}" for="{id}">{question}</label>
                            <span class="smallertext">{helper}</span>
                        </div>
                        <div class="tablecell">
                            <input class="textbox" type="email" id="{id}" value="{default_value}" placeholder="{placeholder_value}" is-form-instance-identifier="{is_form_instance_identifier}" {required} autocomplete="off">
                        </div>
                    </div>
                """.format(
                    id=q_id,
                    question=question["question"],
                    helper=question.get("helper", ""),
                    default_value=question.get("default_value", ""),
                    placeholder_value=question.get("placeholder_value", ""),
                    is_form_instance_identifier=q_is_form_instance_identifier,
                    required=q_required,
                )
            else:
                extra_params = ''
                if 'date_format' in question:
                    extra_params += ' date-format="%s" ' % (question['date_format'])
                if 'mask_pattern' in question:
                    extra_params += ' mask-pattern="%s" ' % (question['mask_pattern'])
                html = """
                    <div name="{id}" class="tablerow">
                        <div class="tablecell">
                            <label name="{id}" for="{id}">{question}</label>
                            <span class="smallertext">{helper}</span>
                        </div>
                        <div class="tablecell">
                            <input class="textbox" type="textbox" id="{id}" value="{default_value}" placeholder="{placeholder_value}" {extra_params} is-form-instance-identifier="{is_form_instance_identifier}" {required} autocomplete="off">
                        </div>
                    </div>
                """.format(
                    id=q_id,
                    question=question["question"],
                    helper=question.get("helper", ""),
                    default_value=question.get("default_value", ""),
                    placeholder_value=question.get("placeholder_value", ""),
                    extra_params=extra_params,
                    is_form_instance_identifier=q_is_form_instance_identifier,
                    required=q_required,
                )
        elif q_type == "textarea":
            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <div class="colspanhack">
                            <label name="{id}" for="{id}">{question}</label>
                            <span class="smallertext">{helper}</span>
                        </div>
                    </div>
                    <div class="tablecell">
                        &nbsp;
                    </div>
                </div>
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <textarea id="{id}" class="colspanhack" type="textarea" value="{default_value}" placeholder="{placeholder_value}" {required} autocomplete="off"></textarea>
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                default_value=question.get("default_value", ""),
                placeholder_value=question.get("placeholder_value", ""),
                required=q_required,
            )
        elif q_type == "select":
            options_html = ""
            display_only_html = ""
            display_only_inputs = []
            has_display_only_inputs = "false"
            if 'display_values' in question:
                options = question['display_values']
                for option in options:
                    options_html += """
                        <option display-data='{display_data}' value="{value}">{display}</option>
                    """.format(
                        value=option["value"],
                        display=option["display"],
                        display_data=json.dumps(option.get("display_data", {})),
                    )
                    display_only_inputs.extend(option.get("display_data", {}).keys())
                    if "dep_list" in option:
                        if q_id not in dep_list:
                            dep_list[q_id] = {}
                        dep_list[q_id][option["value"]] = option['dep_list']
                        dep_list[q_id]["all"] = list(set(dep_list[q_id].get('all', []) + option['dep_list']))
            else:
                source_file = constants.FORM_CONFIG_LOCATION + question['source']

                if source_file:
                    _f = gcs.open(source_file)
                    _contents = _f.read()
                    _f.close()
                    options = json.loads(_contents)
                    for option in options:
                        # Check if the option needs to be displayed.
                        _display_option_flg = True
                        _expired_option_flg = False
                        if 'display_until' in option:
                            _display_until = int(datetime.strptime(option['display_until'], "%Y-%m-%d %H:%M:%S").strftime("%Y%m%d%H%M%S"))
                            if is_user_whitelisted == 'Y':
                                if _display_until < _current_datetime_minus_30d_est:
                                    _expired_option_flg = True
                            else:
                                if _display_until < _current_datetime_est:
                                    _expired_option_flg = True
                                # logging.info('[get_html_for_question] Hiding ' + option["value"] + ' since its old')
                        if user_home_country and 'display_countries' in option:
                            if user_home_country not in option['display_countries']:
                                _display_option_flg = False
                                # logging.info('[get_html_for_question] Hiding ' + option["value"] + ' since its not valid for your country (' + user_home_country + ')')
                        # If yes, add option
                        if _display_option_flg:
                            _disabled = ''
                            if _expired_option_flg:
                                _disabled = 'disabled'
                            options_html += """
                                <option display-data='{display_data}' value="{value}" {disabled}>{display}</option>
                            """.format(
                                value=option["value"],
                                display=option["display"],
                                display_data=json.dumps(option.get("display_data", {})),
                                disabled=_disabled,
                            )
                            display_only_inputs.extend(option.get("display_data", {}).keys())

            display_only_inputs = list(set(display_only_inputs))
            display_only_inputs.sort()
            for d_id in display_only_inputs:
                has_display_only_inputs = "true"
                d_question = d_id.replace('_', ' ').capitalize().replace('ttc', 'TTC')
                if d_id.startswith('i_'):
                    d_question = d_question[2:]
                # name is assigned only to the label and div, so that turning display back on is easy
                display_only_html += """
                    <div class="tablerow">
                        <div class="tablecell">
                            <label name="d_{id}" for="d_{d_id}">{d_question}</label>
                        </div>
                        <div class="tablecell">
                            <div name="d_{id}" class="display_only_textbox" id="d_{d_id}"></div>
                        </div>
                    </div>
                """.format(
                    d_question=d_question,
                    d_id=d_id,
                    id=q_id,
                )

            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <label name="{id}" for="{id}">{question}</label>
                        <span class="smallertext">{helper}</span>
                    </div>
                    <div class="tablecell">
                        <select is-form-instance-identifier="{is_form_instance_identifier}" has-display-only-inputs="{has_display_only_inputs}" onchange="javascript:showDependentInputs('{id}')" class="form_instance_identifier textbox" id="{id}" name="{id}" {required} autocomplete="off">
                            <option value="">Select</option>
                            {options_html}
                        </select>
                    </div>
                </div>
                {display_only_html}
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                options_html=options_html,
                display_only_html=display_only_html,
                has_display_only_inputs=has_display_only_inputs,
                is_form_instance_identifier=q_is_form_instance_identifier,
                required=q_required,
            )
        elif q_type == "radio":
            options_html = ""
            options = question['display_values']
            for option in options:
                if option["value"] == "other":
                    other_text_html = '<input class="textbox" type="textbox" id="{id}_{value}_text">'.format(
                        id=q_id,
                        value=option["value"],
                        display=option["display"],
                    )
                else:
                    other_text_html = ''
                options_html += """
                    <div name="{id}">
                        <input onchange="javascript:showDependentInputs('{id}')" type="radio" id="{id}_{value}" name="{id}" value="{value}" {required}>&nbsp;<label class="label_input" name="{id}" for="{id}_{value}" autocomplete="off">{display}</label>
                        {other_text_html}
                    </div>
                """.format(
                    id=q_id,
                    value=option["value"],
                    display=option["display"],
                    other_text_html=other_text_html,
                    required=q_required,
                )
                if "dep_list" in option:
                    if q_id not in dep_list:
                        dep_list[q_id] = {}
                    dep_list[q_id][option["value"]] = option['dep_list']
                    dep_list[q_id]["all"] = list(set(dep_list[q_id].get('all', []) + option['dep_list']))
            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <label name="{id}" for="{id}_hidden">{question}</label>
                        <input type="hidden" id="{id}_hidden" name="{id}" value="radio" {required}>
                        <span class="smallertext">{helper}</span>
                    </div>
                    <div class="tablecell">
                        <div class="form-rightcol-inner-container form-rightcol-centered">
                            <form autocomplete="off">
                                {options_html}
                            </form>
                        </div>
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                options_html=options_html,
                required=q_required,
            )
        elif q_type == "checkbox_group":
            options_html = ""
            options = question['display_values']
            for option in options:
                if option["value"] == "other":
                    other_text_html = '<input class="textbox" type="textbox" id="{id}_{value}_text">'.format(
                        id=q_id,
                        value=option["value"],
                        display=option["display"],
                    )
                else:
                    other_text_html = ''
                options_html += """
                    <div name="{id}">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td>
                                    <input type="checkbox" id="{id}_{value}" name="{id}" value="{value}" autocomplete="off">
                                </td>
                                <td style="padding-left:5px;">
                                    <label class="label_input" name="{id}" for="{id}_{value}">{display}</label>
                                </td>
                            </tr>
                        </table>
                        {other_text_html}
                    </div>
                """.format(
                    id=q_id,
                    value=option["value"],
                    display=option["display"],
                    other_text_html=other_text_html,
                )
                if "dep_list" in option:
                    if q_id not in dep_list:
                        dep_list[q_id] = {}
                    dep_list[q_id][option["value"]] = option['dep_list']
                    dep_list[q_id]["all"] = list(set(dep_list[q_id].get('all', []) + option['dep_list']))
            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <label name="{id}" for="{id}_hidden">{question}</label>
                        <input type="hidden" id="{id}_hidden" name="{id}" value="checkbox_group" {required} autocomplete="off">
                        <span class="smallertext">{helper}</span>
                    </div>
                    <div class="tablecell">
                        <div class="form-rightcol-inner-container form-rightcol-left">
                            {options_html}
                        </div>
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                options_html=options_html,
                required=q_required,
            )
        elif q_type == "repeater":
            options_html = ""
            options = question['questions']
            repeat_question_list[q_id] = []
            for option in question['questions']:
                q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question(option)
                javascript += q_javascript
                dep_list.update(q_dep_list)
                options_html += q_html
                repeat_question_list.update(q_repeat_question_list)
                repeat_question_list[q_id].append(option["id"])
            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <div class="colspanhack">
                            <hr class='silver-hr'>
                        </div>
                    </div>
                    <div class="tablecell">
                    </div>
                </div>
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <div class="titletext colspanhack">
                            {question} <!--(min {min_count} required)--> (<span id="{id}_count">0</span> added)
                        </div>
                        <span class="smallertext">{helper}</span>
                    </div>
                    <div class="tablecell">
                    </div>
                </div>
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        &nbsp;
                    </div>
                    <div class="tablecell">
                        <select id="{id}" form-entry-type="repeater" required autocomplete="off">
                            <option value="summary">0 added</option>
                        </select>
                        <div style="text-align: left;display: inline-block;">
                            &nbsp;&nbsp;
                            <a class="an-simple-button" onclick="javascript:new_repeat_entry('{id}');">&nbsp;<i class="fa fa-plus-circle fa-lg" aria-hidden="true"></i>&nbsp;</a>
                            &nbsp;&nbsp;
                            <a class="an-simple-button" onclick="javascript:remove_repeat_entry('{id}');">&nbsp;<i class="fa fa-minus-circle fa-lg" aria-hidden="true"></i>&nbsp;</a>
                        </div>
                    </div>
                </div>
                <!--
                <div class="tablerow">
                    <div class="tablecell">
                        &nbsp;
                    </div>
                    <div class="tablecell maxwidth">
                        <div style="display: table;">
                            <div class="tablerow">
                                <div style="text-align: left;display: table-cell;">
                                    <a class="an-simple-button" onclick="javascript:new_repeat_entry('{id}');">&nbsp;<i class="fa fa-plus-circle fa-lg" aria-hidden="true"></i>&nbsp;</a>&nbsp;&nbsp;
                                </div>
                                <div style="text-align: right;display: table-cell;">
                                    <a class="an-simple-button" onclick="javascript:remove_repeat_entry('{id}');">&nbsp;<i class="fa fa-minus-circle fa-lg" aria-hidden="true"></i>&nbsp;</a>&nbsp;&nbsp;
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                -->
                {options_html}
                <div id="{id}_save" class="tablerow">
                    <div class="tablecell">
                        &nbsp;
                    </div>
                    <div class="tablecell maxwidth">
                        <div style="display: table;">
                            <div class="tablerow">
                                <div style="text-align: right;display: table-cell;">
                                    <a class="an-simple-button" onclick="javascript:save_repeat_entry('{id}');"><i class="fa fa-check-square fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;Save</a>
                                </div>
                            </div>
                        </div>
                        <div class="smallertext" style="margin-top:7px;text-align: left;font-style: italic;">
                            Remember to save your entry
                        </div>
                    </div>
                </div>
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <div class="colspanhack">
                            <hr class='silver-hr'>
                        </div>
                    </div>
                    <div class="tablecell">
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                min_count=question["min_count"],
                helper=question.get("helper",""),
                options_html=options_html,
            )
        elif q_type == "image":
            # actual file input is set as t_ to avoid it being loaded with data
            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <label name="{id}" for="{id}">{question}</label><br>
                        <span class="smallertext">
                            {helper}
                            <div id="{id}-loading" style="visibility: hidden;"><i>uploading your photo</i><div class="loader"></div></div>
                        </span>
                    </div>
                    <div class="tablecell">
                        <div class="form-rightcol-inner-container form-rightcol-centered">
                            <input class="textbox" type="textbox" id="{id}" {required} autocomplete="off">
                            <form action="/" method="POST" enctype="multipart/form-data" target="hiddeniframe">
                                <input type="file" name="{id}" id="t_{id}_upload" onchange="uploadPhotos(this,this.files)" accept=".jpg,.jpeg,.png,.gif,image/*" autocomplete="off">
                            </form>
                        </div>
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                required=q_required,
            )
        return (html, javascript, dep_list, repeat_question_list)
    # [END get_html_for_question]


    def get(self,obj):
        # f = open('storage/application_questions-v2.json', 'r')
        user = users.get_current_user()
        if user:
            user_email_addr = user.email()
            user_logout_url = users.create_logout_url('/')
            user_login_url = ""
            user_id = user.user_id()
        else:
            self.response.write("ERROR: Please log in")
            return

        try:
            user_country = self.request.headers['X-AppEngine-Country']
            user_city = self.request.headers['X-Appengine-City']
            user_region = self.request.headers['X-AppEngine-Region']
            user_city_state_country = user_city.title() + ', ' + user_region.upper() + ', ' + user_country.upper()
        except Exception as e:
            user_country = ''
            user_city = ''
            user_region = ''
            user_city_state_country = ''

        logging.info('[Form][get] ' + obj + ' [' + user.email() + ']')

        page_no = self.request.get('page_no')
        if page_no:
            page_no = int(page_no)
        else:
            page_no = 1
        user_home_country_iso = self.request.get('user_home_country_iso', user_country)
        logging.info('[Form][get] user_home_country_iso = ' + user_home_country_iso)

        # if user_home_country_iso and user_home_country_iso.strip() != '' and user:
        #     user_email_addr = user.email()
        #     logging.info('[Form][get] Setting user_home_country = ' + user_home_country_iso)
        #     _ttc_user = ttc_portal_user.TTCPortalUser(user_email_addr)
        #     _ttc_user.set_home_country(user_home_country_iso)
        #     _ttc_user.save_user_data()

        countries = constants.COUNTRIES

        questions_file = None
        if obj == "form/ttc_application.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/ttc_application.json'
        elif obj == "form/ttc_evaluation.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/ttc_evaluation.json'
        elif obj == "form/ttc_applicant_profile.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/ttc_applicant_profile.json'
        elif obj == "form/ttc_evaluator_profile.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/ttc_evaluator_profile.json'
        elif obj == "form/post_ttc_self_evaluation_form.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/post_ttc_self_evaluation_form.json'
        elif obj == "form/post_ttc_feedback_form.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/post_ttc_feedback_form.json'
        elif obj == "form/post_sahaj_ttc_self_evaluation_form.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/post_sahaj_ttc_self_evaluation_form.json'
        elif obj == "form/post_sahaj_ttc_feedback_form.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/post_sahaj_ttc_feedback_form.json'
        elif obj == "form/ttc_portal_settings.html":
            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/ttc_portal_settings.json'

        if questions_file:
            _f = gcs.open(questions_file)
            _contents = _f.read()
            _f.close()
            form = json.loads(_contents)
            form_name = form["form_name"]
            form_type = form["form_type"]
            form_description = form["form_description"]
            form_agreement = form.get("form_agreement", [])
            form_dep_list = form.get("dep_list", [])
            form_is_multi_instance = form.get("is_multi_instance_form", "false")
            pages = form["pages"]
            no_of_pages = len(pages)

            form_html = ""
            form_instance_list = []

            admin_config = {}
            whitelisted_user_emails = []
            is_user_whitelisted = 'N'
            try:
                _f = gcs.open(constants.ADMIN_CONFIG_FILE)
                admin_config = json.loads(_f.read())
                _f.close()
            except gcs.NotFoundError:
                logging.info('[form] Failed to load the system config')
                admin_config = {}
            if 'whitelisted_user_emails' in admin_config:
                whitelisted_user_emails = admin_config['whitelisted_user_emails']
            if user_email_addr.lower() in whitelisted_user_emails:
                is_user_whitelisted = 'Y'
                logging.info('[Form][get] user is marked as whitelisted')

            if form_is_multi_instance == 'true':
                # Get existing form instances and show page if > 0
                if user:
                    user_email_addr = user.email()
                    _ttc_user = ttc_portal_user.TTCPortalUser(user_email_addr)
                    _form_instances = _ttc_user.get_form_instances(form_type)
                    if len(_form_instances) > 0:
                        _display_values = []
                        _page_html = ""
                        for _fi in _form_instances:
                            form_instance_list.append(_fi)
                            _display = _form_instances[_fi]['display']
                            _page_data = _form_instances[_fi]['page_data']
                            _display_values.append({
                                "value": _fi,
                                "display": _display,
                                "display_data": _page_data,
                            })
                        q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question({
                            "id": "form_instance_start_new_button",
                            "display_value": """
                                <div style='text-align:center;'>
                                    <a id="btn_startNew" class="an-c2a-button" onclick="javascript:nextPage();">
                                        <i class="fa fa-plus-square fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;Start a New {form_name}
                                    </a>
                                </div>
                            """.format(
                                form_name=form_name,
                            ),
                            "type": "general",
                        })
                        _page_html = q_html
                        q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question({
                            "id": "form_instance_separator",
                            "display_value": "<div style='text-align:center;'>--------------------- OR ---------------------</div>",
                            "type": "general",
                        })
                        _page_html += q_html
                        q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question({
                            "id": "form_instance",
                            "question": "Select existing",
                            "type": "select",
                            "display_values": _display_values
                        })
                        _page_html += q_html
                        q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question({
                            "id": "form_instance_start_load_existing",
                            "display_value": """
                                <div style='text-align:center;'>
                                    <a id="btn_loadExisting" class="an-c2a-button" onclick="javascript:loadPage('');">
                                        <i class="fa fa-pencil-square-o fa-lg" aria-hidden="true"></i>&nbsp;&nbsp;Load the selected {form_name}
                                    </a>
                                </div>
                            """.format(
                                form_name=form_name,
                            ),
                            "type": "general",
                        })
                        _page_html += q_html
                        form_html += """
                            <div id="page{page_no}" class="page tablebody" is-form-instance-selector="{is_form_instance_selector}">
                                <div class="tablerow">
                                    <div class="tablecell">
                                        <div class="colspanhack">
                                            <br>
                                            <div class="pagetitletext">
                                                <i class="fa fa-tasks" aria-hidden="true"></i>&nbsp;&nbsp;Select your {form_name}
                                            </div>
                                            <div class="smallertext">
                                                &nbsp;&nbsp;Please select
                                            </div>
                                            <hr class='pagetitle-hr'>
                                        </div>
                                    </div>
                                </div>
                                {page_html}
                            </div>
                        """.format(
                            page_no=0,
                            form_name=form_name,
                            page_html=_page_html,
                            is_form_instance_selector="true",
                        )
                        # ensure others are not displayed
                        page_no = 0

            # Process normal pages
            questions_javascript = ""
            questions_dep_list = {}
            repeat_question_list = {}
            for i, page in enumerate(pages):
                page_html = ""
                page_name = page["page_name"]
                questions = page["questions"]
                is_form_instance_identifier = page.get("is_form_instance_identifier", "false")

                for question in questions:
                    q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question(question, user_home_country_iso, is_user_whitelisted)
                    questions_javascript += q_javascript
                    questions_dep_list.update(q_dep_list)
                    repeat_question_list.update(q_repeat_question_list)
                    page_html += q_html
                    # self.response.write(question["id"])
                    # self.response.write(q_html)
                if i+1 != page_no:
                    style = "display:none"
                else:
                    style = ""
                form_html += """
                    <div id="page{page_no}" page_no="{page_no}" page_name="{page_name}" class="page tablebody" is-form-instance-identifier="{is_form_instance_identifier}" style="{style}">
                        <div class="tablerow">
                            <div class="tablecell">
                                <div class="colspanhack">
                                    <br>
                                    <div class="pagetitletext">
                                        <i class="fa fa-tasks" aria-hidden="true"></i>&nbsp;&nbsp;{page_name}
                                    </div>
                                    <div class="smallertext">
                                        &nbsp;&nbsp;Page <span id="curr_page_no">{page_no}</span> of {no_of_pages}
                                    </div>
                                    <hr class='pagetitle-hr'>
                                </div>
                            </div>
                        </div>
                        {page_html}
                    </div>
                """.format(
                    page_no=(i+1),
                    no_of_pages=no_of_pages,
                    page_name=page_name,
                    page_html=page_html,
                    style=style,
                    is_form_instance_identifier=is_form_instance_identifier,
                )

            template = JINJA_ENVIRONMENT.get_template("form/empty_form.html")
            
            self.response.write(template.render(
                form_name=form_name,
                form_type=form_type,
                form_description=form_description,
                form_agreement=json.dumps(form_agreement),
                form_html=form_html,
                page_no=page_no,
                no_of_pages=no_of_pages,
                questions_javascript=questions_javascript,
                questions_dep_list=json.dumps(questions_dep_list),
                repeat_question_list=json.dumps(repeat_question_list),
                user_email_addr=user_email_addr,
                user_id=user_id,
                user_logout_url=user_logout_url,
                user_login_url=user_login_url,
                user_country=user_country,
                user_city=user_city,
                user_state=user_region,
                user_city_state_country=user_city_state_country,
                countries=countries,
                google_public_api_key=constants.GOOGLE_PUBLIC_API_KEY,
                google_maps_api_key=constants.GOOGLE_MAPS_API_KEY,
                form_instance_list=json.dumps(form_instance_list),
                form_is_multi_instance=form_is_multi_instance,
                user_photo_folder=constants.USER_PHOTO_FOLDER,
                BLANK=constants.BLANK,
                IS_DEV=constants.IS_DEV,
                is_user_whitelisted=is_user_whitelisted,
            ))
        else:
            self.response.write("Unknown Page")

#[END Form]

# # [START DB Storage]
# from google.appengine.ext import ndb

# # [START FormEntry]
# class FormEntry(ndb.Model):
#     form_entry_id = ndb.IntegerProperty()
#     text = ndb.StringProperty()
#     entry_type = ndb.StringProperty()
#     repeater_group_entry_id = ndb.IntegerProperty()
#     create_datetime = ndb.DateTimeProperty(auto_now_add=True)
#     update_datetime = ndb.DateTimeProperty(auto_now_add=True)

# # [START FormEntry]
# class FormEntry(ndb.Model):
#     form_entry_id = ndb.IntegerProperty()
#     form_id = ndb.IntegerProperty()
#     text = ndb.StringProperty()
#     form_page_id = ndb.IntegerProperty()
#     entry_order_no = ndb.IntegerProperty()
#     entry_type = ndb.StringProperty()
#     repeater_group_entry_id = ndb.IntegerProperty()
#     create_datetime = ndb.DateTimeProperty(auto_now_add=True)
#     update_datetime = ndb.DateTimeProperty(auto_now_add=True)

# def insert_form_entry(
#         form_entry_id,
#         form_id,
#         text,
#         form_page_id,
#         entry_order_no,
#         entry_type,
#         repeater_group_entry_id,
#     ):
#     # Default http protocol if no protocol present
#     logging.info('[insert_form_entry] Creating form entry')
#     # current_user = users.get_current_user()
#     form_entry = FormEntry(
#         form_entry_id=form_entry_id,
#         form_id=form_id,
#         text=text,
#         form_page_id=form_page_id,
#         entry_order_no=entry_order_no,
#         entry_type=entry_type,
#         repeater_group_entry_id=repeater_group_entry_id,
#     )
#     form_entry_key = form_entry.put()
#     logging.info('[insert_form_entry] Form entry created successfully')
#     return form_entry_key
# # [END FormEntry]

# class Form(ndb.Model):
#     form_id = ndb.IntegerProperty()
#     form_name = ndb.StringProperty()
#     create_datetime = ndb.DateTimeProperty(auto_now_add=True)
#     update_datetime = ndb.DateTimeProperty(auto_now_add=True)

# def insert_form(
#         form_id,
#         form_name,
#     ):
#     # Default http protocol if no protocol present
#     logging.info('[insert_form] Creating form entry')
#     # current_user = users.get_current_user()
#     form = Form(
#         form_id=form_id,
#         form_name=form_name,
#     )
#     form_key = form.put()
#     logging.info('[insert_form] Form entry created successfully')
#     return form_key
# # [END Form]

# # [START form]
# class Form(object):
#     """docstring for Form"""
#     def __init__(self, arg):
#         super(Form, self).__init__()
#         self.arg = arg

# [END DB Storage]


app = webapp2.WSGIApplication(
    [
        ('/(.*html)?', Form),
    ],
    debug=True
)
