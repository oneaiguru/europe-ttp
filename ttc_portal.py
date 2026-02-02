from __future__ import absolute_import
import os
import urllib
import unicodedata
import logging
import json

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import app_identity
from google.appengine.api import mail

import jinja2
import webapp2

import constants
from pyutils import utils
from ttc_portal_user import TTCPortalUser

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

#[START TTCPortal]
class TTCPortal(webapp2.RequestHandler):
    def get(self):
        logging.info('[ttc_portal][get] called');
        # if self.request.path == '/support' or self.request.path == '/':
        try:
            user_country = self.request.headers['X-AppEngine-Country']
            user_home_country = user_country
            user_city = self.request.headers['X-Appengine-City']
            user_region = self.request.headers['X-AppEngine-Region']
            user_city_state_country = user_city.title() + ', ' + user_region.upper() + ', ' + user_country.upper()
        except Exception as e:
            user_country = ''
            user_city = ''
            user_region = ''
            user_city_state_country = ''
        template = JINJA_ENVIRONMENT.get_template('ttc_portal.html')
        user = users.get_current_user()
        if user:
            user_email_addr = user.email()
            user_logout_url = users.create_logout_url('/')
            user_login_url = ''
            user_id = user.user_id()
            _ttc_user = TTCPortalUser(user_email_addr)
            _user_home_country = _ttc_user.get_home_country()
            if _user_home_country and _user_home_country.strip() != '':
                user_home_country = _user_home_country
            user_report_permissions = constants.LIST_OF_ADMIN_PERMISSIONS.get(user_email_addr, {}).get('report_permissions', [])
            logging.info('[ttc_portal.py][get] LIST_OF_ADMIN_PERMISSIONS = ' + json.dumps(constants.LIST_OF_ADMIN_PERMISSIONS))
            logging.info('[ttc_portal.py][get] ADMIN_PERMISSIONS = ' + json.dumps(constants.LIST_OF_ADMIN_PERMISSIONS.get(user_email_addr, {})))
            logging.info('[ttc_portal.py][get] REPORT_PERMISSIONS = ' + json.dumps(constants.LIST_OF_ADMIN_PERMISSIONS.get(user_email_addr, {}).get('report_permissions', [])))
        else:
            user_email_addr = ''
            user_logout_url = ''
            user_login_url = users.create_login_url('/')
            user_id = ''
            user_home_country = ''
            user_report_permissions = ''
        self.response.write(template.render(
            user_country=user_country,
            user_home_country_iso=user_home_country,
            user_home_country=constants.COUNTRIES_MAP_ISO2NAME.get(user_home_country, ''),
            user_city=user_city,
            user_region=user_region,
            user_city_state_country=user_city_state_country,
            user_email_addr=user_email_addr,
            user_logout_url=user_logout_url,
            user_login_url=user_login_url,
            user_id=user_id,
            google_public_api_key=constants.GOOGLE_PUBLIC_API_KEY,
            default_bucket_name=constants.BUCKET_NAME,
            list_of_admins=constants.LIST_OF_ADMINS,
            user_report_permissions=user_report_permissions,
        ))
#[END TTCPortal]

app = webapp2.WSGIApplication(
    [
        ('/*', TTCPortal),
    ],
    debug=True
)
