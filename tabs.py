# import webapp2
from __future__ import absolute_import

import os
import urllib
import unicodedata
import logging
import base64
import hashlib
import constants

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import app_identity
from google.appengine.api import mail

import jinja2
import webapp2

from pyutils import utils

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

#[START Tabs]
class Tabs(webapp2.RequestHandler):
    def get(self,obj):
        template = JINJA_ENVIRONMENT.get_template(obj)
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

        user_home_country = self.request.get('user_home_country', user_country)
        user_home_country_iso = self.request.get('user_home_country_iso', user_country)
        logging.info('[Tabs][get] user_home_country_iso ' + user_home_country_iso)

        self.response.write(template.render(
            user_email_addr=user_email_addr,
            user_logout_url=user_logout_url,
            user_login_url=user_login_url,
            user_country=user_country,
            user_city=user_city,
            user_state=user_region,
            user_city_state_country=user_city_state_country,
            user_home_country_iso=user_home_country_iso,
            user_home_country=user_home_country,
            countries=constants.COUNTRIES,
        ))
#[END Tabs]

app = webapp2.WSGIApplication(
    [
        ('/(.*html)?', Tabs),
    ],
    debug=True
)
