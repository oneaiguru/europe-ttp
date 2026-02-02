# import webapp2
import os
import urllib
import unicodedata
import logging
import base64
import hashlib
import json
import cgi
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
from reporting import reporting_utils

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

#[START UserReport]
class UserReport(webapp2.RequestHandler):

    def get_user_image_url(self, image_file, max_width):
        # from google.appengine.ext.blobstore import BlobKey
        # from google.appengine.api.images import get_serving_url
        # key = BlobKey('imagekey')
        # url = get_serving_url(key)

        # https://stackoverflow.com/questions/6566383/clear-example-of-using-google-app-engine-images-get-serving-url
        path = '/gs' + CLOUD_STORAGE_LOCATION + image_file
        key = blobstore.create_gs_key(path)
        # This is going to generate url for original sized image
        # url = images.get_serving_url(key, size=0)
        url = images.get_serving_url(key, size=max_width, crop=True)
        return url

    # [START get_html_for_question] 
    def get_html_for_question(self, question, value_dict):
        _current_datetime_est = int(dt_utils.utc_to_timezone(datetime.today(), dt_utils.Eastern).strftime("%Y%m%d%H%M%S"))
        q_type = question["type"]
        q_id = question.get("id","")
        value = value_dict.get(q_id, '')
        if isinstance(value , basestring):
            value = cgi.escape(value)
        logging.info('[get_html_for_question] evaluating ' + q_id)
        html = ""
        javascript = ""
        dep_list = []
        repeat_question_list = {}

        ans_style = """
            style="
                color:#1355a0;
            "
        """
        lhs_style = """
            style="
                max-width:400px;
                word-wrap:break-word;
            "
        """
        rhs_style = """
            style="
                color:#1355a0;
                max-width:210px;
                word-wrap:break-word;
            "
        """
        if q_type == "question" or q_type == "general":
            html = """
                <div class="tablerow">
                    <div class="tablecell">
                        <div id="{id}" class="colspanhack">
                            {question}
                            <span class="smallertext">{helper}</span>
                        </div>
                    </div>
                    <div class="tablecell">
                        &nbsp;
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question.get("question", question.get("display_value")),
                helper=question.get("helper", ""),
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
            )
        elif q_type == "text" or q_type == "select" or q_type == "radio":
            if q_type == "select" or q_type == "radio":
                if 'display_values' in question:
                    options = question['display_values']
                    for option in options:
                        if value == option["value"]:
                            value = option["display"]
                            if 'dep_list' in option:
                                dep_list += option['dep_list']

            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell" {lhs_style}>
                        <label for="{id}">{question}</label>
                        <span class="smallertext">{helper}</span>
                    </div>
                    <div class="tablecell">
                        <div class="textbox" id="{id}" {rhs_style}>{value}</div>
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                value=unicodedata.normalize('NFKD', unicode(value)).encode('ascii','ignore'),
                lhs_style=lhs_style,
                rhs_style=rhs_style,
            )
        elif q_type == "checkbox_group":
            options_html = ""
            if 'display_values' in question:
                options = question['display_values']
                for option in options:
                    t_id = q_id + '_' + option["value"]
                    if value_dict.get(t_id, False) == True:
                        value = option["display"]
                        options_html += """
                            <div id="{id}" {rhs_style}>&#8226; {value}</div>
                        """.format(
                            id=t_id,
                            value=value,
                            rhs_style=rhs_style,
                        )
                        if 'dep_list' in option:
                            dep_list += option['dep_list']

            if not options_html:
                options_html = """
                    <div id="{id}" {ans_style}>none selected</div>
                """.format(
                    id=q_id,
                    ans_style=ans_style,
                )

            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell" {lhs_style}>
                        <label for="{id}">{question}</label>
                        <span class="smallertext">{helper}</span>
                    </div>
                    <div class="tablecell">
                        {options_html}
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                options_html=options_html,
                lhs_style=lhs_style,
            )
        elif q_type == "textarea":
            html = """
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <div class="colspanhack">
                            <label for="{id}">{question}</label>
                            <span class="smallertext">{helper}</span>
                        </div>
                    </div>
                    <div class="tablecell">
                        &nbsp;
                    </div>
                </div>
                <div name="{id}" class="tablerow">
                    <div class="tablecell">
                        <div class="textbox colspanhack" id="{id}" {ans_style}>{value}</div>
                    </div>
                </div>
            """.format(
                id=q_id,
                question=question["question"],
                helper=question.get("helper", ""),
                value=unicodedata.normalize('NFKD', unicode(value)).encode('ascii','ignore'),
                ans_style=ans_style,
            )
        elif q_type == "repeater":
            options_html = ""
            count = 0
            options = question['questions']
            repeat_question_list[q_id] = []
            if isinstance(value, list):
                count = len(value)
                for _val in value:
                    for option in question['questions']:
                        q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question(option, _val)
                        options_html += q_html
                        javascript += q_javascript
                        dep_list.append(q_dep_list)
                    options_html += "<br>"
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
                            {question} (min {min_count} required) (<span id="{id}_count">{count}</span> added)
                        </div>
                        <span class="smallertext">{helper}</span>
                    </div>
                    <div class="tablecell">
                    </div>
                </div>
                {options_html}
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
                count=str(count),
                helper=question.get("helper",""),
                options_html=options_html,
            )
        elif q_type == "image":
            pass
        return (html, javascript, dep_list, repeat_question_list)
    # [END get_html_for_question]


    def get_user_application(self, retrieval_type):
        # f = open('storage/application_questions-v2.json', 'r')
        user = users.get_current_user()
        if user:
            user_email_addr = user.email()
            user_logout_url = users.create_logout_url('/')
            user_login_url = ""
            user_id = user.user_id()
        else:
            user_email_addr = ""
            user_logout_url = ""
            callback_url = self.request.get('callback_url')
            user_login_url = users.create_login_url(callback_url)
            user_id = ""

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

        user_home_country_iso = self.request.get('user_home_country_iso', user_country)
        logging.info('[Form][get] user_home_country_iso ' + user_home_country_iso)

        print_on_load = self.request.get('print_on_load', 'N')
        if retrieval_type == 'forms_combined':
            _forms_list = json.loads(self.request.get('forms'))
        else:
            _email = self.request.get('email')
            _form_type = self.request.get('form_type')
            _form_instance = self.request.get('form_instance')
            _forms_list = [{
                'email': _email, 
                'form_type': _form_type,
                'form_instance': _form_instance,
            }]

        form_html = ""
        for i, _form in enumerate(_forms_list):
            _email = _form['email']
            _form_type = _form['form_type']
            _form_instance = _form['form_instance']

            _ttc_user = ttc_portal_user.TTCPortalUser(_email)
            _form_data = _ttc_user.get_form_data(_form_type, _form_instance)

            questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/' + _form_type + '.json'

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

                if i == 0:
                    candidate_name = _form_data.get("i_fname", "") + " " + _form_data.get("i_lname", "")
                    form_filename = candidate_name.replace(" ", "_") + "-" + _form_type
                    candidate_email = _ttc_user.get_email()
                    candidate_phone = _form_data.get("i_cellphone", "")
                    candidate_city_state_country = "{city}, {state}, {country}".format(
                        city=_form_data.get("i_address_city", ""),
                        state=_form_data.get("i_address_state", ""),
                        country=_form_data.get("i_country", ""),
                    )
                    
                    application_status, evaluation_status = reporting_utils.get_reporting_status(
                        _form_type, 
                        _ttc_user.is_form_submitted(_form_type, _form_instance),
                        _ttc_user.is_form_complete(_form_type, _form_instance),
                        0
                    )
                    candidate_photo_url = _ttc_user.get_public_photo_url()

                _form_html = ""
                form_instance_list = []
                # Process normal pages
                questions_dep_list = []
                repeat_question_list = {}
                for i, page in enumerate(pages):
                    page_html = ""
                    page_name = page["page_name"]
                    questions = page["questions"]

                    for question in questions:
                        q_html, q_javascript, q_dep_list, q_repeat_question_list = self.get_html_for_question(question, _form_data)
                        questions_dep_list.append(q_dep_list)
                        repeat_question_list.update(q_repeat_question_list)
                        page_html += q_html
                    _form_html += """
                        <div id="page{page_no}" class="tablebody">
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
                    )
                
                if retrieval_type == 'forms_combined':
                    _template = "reporting_tab.html"
                    template = JINJA_ENVIRONMENT.get_template(_template)

                    form_html += template.render(
                        form_name=form_name,
                        form_type=form_type,
                        form_description=form_description,
                        form_agreement=json.dumps(form_agreement),
                        # Using temp var here
                        form_html=_form_html,
                        no_of_pages=no_of_pages,
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
                        google_public_api_key=constants.GOOGLE_PUBLIC_API_KEY,
                        form_instance_list=json.dumps(form_instance_list),
                        form_is_multi_instance=form_is_multi_instance,
                        user_photo_folder=constants.USER_PHOTO_FOLDER,
                    )
                else:
                    form_html += _form_html

            if retrieval_type == 'html':
                _template = "reporting_tab.html"
            elif retrieval_type == 'forms_combined':
                _template = "reporting_combined.html"
            else:
                _template = "reporting_form.html"

            template = JINJA_ENVIRONMENT.get_template(_template)

        final_html = template.render(
            form_name=form_name,
            form_type=form_type,
            form_description=form_description,
            form_agreement=json.dumps(form_agreement),
            form_html=form_html,
            no_of_pages=no_of_pages,
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
            google_public_api_key=constants.GOOGLE_PUBLIC_API_KEY,
            form_instance_list=json.dumps(form_instance_list),
            form_is_multi_instance=form_is_multi_instance,
            user_photo_folder=constants.USER_PHOTO_FOLDER,
            form_filename=form_filename,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            candidate_phone=candidate_phone,
            candidate_city_state_country=candidate_city_state_country,
            application_status=application_status,
            evaluation_status=evaluation_status,
            candidate_photo_url=candidate_photo_url,
            print_on_load=print_on_load,
        )
        self.response.write(final_html)
        # else:
        #     self.response.write("Unknown Page")

    def get(self):
        user = users.get_current_user()
        if user:
            user_email_addr = user.email()
        else:
            user_email_addr = ""

        if user_email_addr not in constants.LIST_OF_ADMINS:
            self.response.write("<b>UN-AUTHORIZED</b>")
        else:
            if self.request.path == '/reporting/user-report/get-user-application-html':
                _retrieval_type = 'html'
            elif self.request.path == '/reporting/user-report/get-user-application':
                _retrieval_type = 'forms'
            elif self.request.path == '/reporting/user-report/get-user-application-combined':
                _retrieval_type = 'forms_combined'
            self.get_user_application(_retrieval_type)

#[END UserReport]

app = webapp2.WSGIApplication(
    [
        ('/reporting/user-report/get-user-application-html', UserReport),
        ('/reporting/user-report/get-user-application-combined', UserReport),
        ('/reporting/user-report/get-user-application', UserReport),
    ],
    debug=True
)
