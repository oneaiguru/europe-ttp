# import webapp2
from __future__ import absolute_import

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
from reporting import reporting_utils, Reporting, Integrity
from db import ControlParameters

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

#[START Admin]
class Admin(webapp2.RequestHandler):

    ttc_list_html = None
    user_home_country = None
    ttc_country_and_dates = None

    def set_admin_config(self, config_params):
        _config = self.get_raw_admin_config()
        logging.info('[set_admin_config] config_params = ' + json.dumps(config_params))
        _config.update({'raw_config': config_params})

        # [START] whitelisted_user_emails
        if 'whitelisted_user_emails' not in _config:
            _config['whitelisted_user_emails'] = []
        if 'i_whitelisted_user' in config_params:
            if isinstance(config_params['i_whitelisted_user'], list):
                for _whitelisted_user in config_params['i_whitelisted_user']:
                    if 'i_whitelisted_user_email' in _whitelisted_user:
                        _config['whitelisted_user_emails'].append(_whitelisted_user['i_whitelisted_user_email'].strip().lower())
        # [END] whitelisted_user_emails

        try:
            write_retry_params = gcs.RetryParams(backoff_factor=1.1)
            _f = gcs.open(
                constants.ADMIN_CONFIG_FILE,
                'w',
                content_type='text/plain',
                options={'x-goog-meta-foo': 'foo',
                'x-goog-meta-bar': 'bar'},
                retry_params=write_retry_params
            )
            _f.write(json.dumps(_config))
            _f.close()
        except gcs.Error:
            logging.error('[set_admin_config] Failed to save the system config')

    def get_raw_admin_config(self):
        _config = {}
        try:
            _f = gcs.open(constants.ADMIN_CONFIG_FILE)
            _config = json.loads(_f.read())
            logging.info('[get_raw_admin_config] config_params = ' + json.dumps(_config))
            _f.close()
        except gcs.NotFoundError:
            logging.error('[get_raw_admin_config] Failed to load the system config')
        return _config.get('raw_config', {})

    def get_ttc_list_html(self):
        if not self.ttc_list_html:
            options_html = ""

            source_file = constants.FORM_CONFIG_LOCATION + 'ttc_country_and_dates.json'

            user = users.get_current_user()
            if not self.user_home_country and user:
                user_email_addr = user.email()
                _ttc_user = ttc_portal_user.TTCPortalUser(user_email_addr)
                self.user_home_country = _ttc_user.get_home_country()

            _f = gcs.open(source_file)
            _contents = _f.read()
            self.ttc_country_and_dates = _contents.replace('\n',' ')
            _f.close()
            options = json.loads(_contents)
            for i, option in enumerate(options):
                # Check if the option needs to be displayed.
                _display_option_flg = True
                if self.user_home_country and 'display_countries' in option:
                    if self.user_home_country not in option['display_countries']:
                        _display_option_flg = False
                        # logging.info('[get_html_for_question] Hiding ' + option["value"] + ' since its not valid for your country')
                # If yes, add option
                if _display_option_flg:
                    options_html += """
                        <option value="{value}" {selected}>{display}</option>
                    """.format(
                        value=option["value"],
                        display=option["display"],
                        selected=('selected' if i == len(options) - 1 else ''),
                    )

            ttc_list_html = """
                <div class="form-tab-content form-tab-content-reporting-override" style="margin-top:35px;margin-bottom:23px;">
                    <div class="tablebody">
                        <div name="ttc_list" class="tablerow">
                            <div class="tablecell">
                                <label for="ttc_list">TTC</label>
                                <span class="smallertext">Select the TTC from the dropdown</span>
                            </div>
                            <div class="tablecell">
                                <select class="textbox" id="ttc_list" name="ttc_list" onchange="load_table_data()">
                                {options_html}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            """.format(
                options_html=options_html,
            )

            self.ttc_list_html = ttc_list_html

        return ttc_list_html

    def check_permissions(self, page, user_email_addr=""):
        if user_email_addr == "":
            _user = users.get_current_user()
            if _user:
                user_email_addr = _user.email()

        logging.info('[Admin.check_permissions] checking user_email_addr = ' + user_email_addr + ', page = ' + page)

        if user_email_addr in constants.LIST_OF_ADMIN_PERMISSIONS:
            _report_permissions = constants.LIST_OF_ADMIN_PERMISSIONS[user_email_addr]['report_permissions']
            if page in _report_permissions:
                return True
            else:
                return False
        else:
            return False

    #[START get_user_reporting_last_updated_datetime]
    @staticmethod
    def get_user_reporting_last_updated_datetime():
        cparams = ControlParameters.fetch()
        if cparams:
            min_us_updated_datetime = cparams.user_summary_last_update_datetime
            min_ui_updated_datetime = cparams.user_integrity_last_update_datetime
        if min_us_updated_datetime in locals():
            _f = gcs.stat(constants.USER_SUMMARY_BY_FORM_TYPE)
            min_us_updated_datetime = datetime.fromtimestamp(_f.st_ctime)
        if min_ui_updated_datetime in locals():
            _f = gcs.stat(constants.USER_INTEGRITY_BY_FORM_TYPE)
            min_ui_updated_datetime = datetime.fromtimestamp(_f.st_ctime)
        return {
            'user_summary_last_updated_datetime': dt_utils.utc_to_local(min_us_updated_datetime).strftime('%Y-%m-%d %H:%M:%S'),
            'user_integrity_last_updated_datetime': dt_utils.utc_to_local(min_ui_updated_datetime).strftime('%Y-%m-%d %H:%M:%S'),
        }
    #[END get_user_reporting_last_updated_datetime]

    def post(self,obj):
        _user_email_addr = ""
        _user = users.get_current_user()
        if self.check_permissions('admin_settings.html'):
            if self.request.path == '/admin/set-config':
                _config_params = json.loads(self.request.get('config_params'))
                self.set_admin_config(_config_params)

    def get(self,obj):
        if self.request.path == '/admin/get-config':
            if self.check_permissions('admin_settings.html'):
                self.response.write(json.dumps(self.get_raw_admin_config()))
            else:
                self.response.write("")
        else:
            _page = obj.split('/')[-1]

            user = users.get_current_user()
            if user:
                user_email_addr = user.email()
                user_logout_url = users.create_logout_url('/')
                user_login_url = ""
            else:
                user_email_addr = ""
                user_logout_url = ""
                callback_url = self.request.get('callback_url')
                user_login_url = users.create_login_url(callback_url)

            if not self.check_permissions(_page, user_email_addr):
                self.response.write("<b>UN-AUTHORIZED</b>")
            else:
                template = JINJA_ENVIRONMENT.get_template(obj)

                if user_email_addr not in constants.LIST_OF_ADMINS:
                    self.response.write("<b>UN-AUTHORIZED</b>")
                else:
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

                    ttc_list_html = self.get_ttc_list_html()

                    last_updated_datetimes = Admin.get_user_reporting_last_updated_datetime()

                    self.response.write(template.render(
                        user_email_addr=user_email_addr,
                        user_logout_url=user_logout_url,
                        user_login_url=user_login_url,
                        user_country=user_country,
                        user_city=user_city,
                        user_state=user_region,
                        user_city_state_country=user_city_state_country,
                        user_home_country_iso=self.user_home_country,
                        ttc_list_html=ttc_list_html,
                        ttc_country_and_dates=self.ttc_country_and_dates,
                        reporting_status=reporting_utils.ReportingStatus,
                        user_summary_last_updated_datetime=last_updated_datetimes.get('user_summary_last_updated_datetime', ''),
                        user_integrity_last_updated_datetime=last_updated_datetimes.get('user_integrity_last_updated_datetime', ''),
                        REPORTING_KEY=Reporting.KEY,
                        INTEGRITY_KEY=Integrity.KEY,
                    ))
#[END Admin]

app = webapp2.WSGIApplication(
    [
        ('/(.*html)?', Admin),
        ('/admin/(.*)?', Admin),
        ('/admin/(.*)?', Admin),
    ],
    debug=True
)
