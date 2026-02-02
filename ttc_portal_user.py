
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
from google.appengine.api import images
from google.appengine.ext import blobstore

import jinja2
import webapp2

import cloudstorage as gcs

import constants
from pyutils import utils

def username_to_email(google_username):
    email = ""
    if google_username and google_username.strip() != '':
        if '@' in google_username:
            email = google_username
        else:
            email = google_username + "@gmail.com"
    return email

class TTCPortalUser:
    def set_form_data(self, f_type, f_instance, f_data, f_instance_page_data, f_instance_display):
        logging.info('[set_form_data] setting form data')
        _instance = 'default'
        if f_instance and f_instance.strip() != '':
            _instance = f_instance

        _form = {}
        if f_type in self.form_data:
            if _instance in self.form_data[f_type]:
                _form = self.form_data[f_type][_instance]

        logging.info('[set_form_data] form data = \n' + json.dumps(f_data))
        _form['data'] = f_data
        _form['form_instance_page_data'] = f_instance_page_data
        _form['form_instance_display'] = f_instance_display

        _is_form_complete = True
        for _t in f_data:
            if f_data[_t] == None or unicode(f_data[_t]).strip() == '':
                _is_form_complete = False
                break

        _form['is_agreement_accepted'] = utils.str2bool(f_data.get('i_agreement_accepted'))
        _form['is_form_submitted'] = utils.str2bool(f_data.get('i_form_submitted'))
        _form['send_confirmation_to_candidate'] = utils.str2bool(f_data.get('i_send_confirmation_to_candidate'))
        # this is handled separately by the uploader
        # if 'i_photo_file' in f_data:
        #     self.photo_file = f_data['i_photo_file']
        #     if self.photo_file and self.photo_file.strip() != '':
        #         self.set_photo_url()

        if 'i_name' in f_data:
            self.name = f_data.get('i_name').strip()
        else:
            self.name = f_data.get('i_fname').strip() + ' ' + f_data.get('i_lname').strip()

        _form['is_form_complete'] = _is_form_complete
        if 'profile' in f_type:
            self.is_profile_complete[f_type] = _is_form_complete
        _form['last_update_datetime'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if f_type not in self.form_data:
            self.form_data[f_type] = {}    
        self.form_data[f_type][_instance] = _form
        # Last stored form is stored in default as well for easy retrieval
        if _instance != 'default':
            self.form_data[f_type]['default'] = _form

        if _form['is_form_submitted']:
            try:
                self.send_submission_emails(f_type, f_instance)
            except Exception as e:
                logging.info('[set_form_data] Error returned from send_submission_emails {0}'.format(e))
            

    def send_submission_emails(self, f_type, f_instance):
        logging.info('[send_submission_emails] called f_type = {f_type} f_instance = {f_instance}'.format(**locals()))
        _form = self.form_data[f_type][f_instance]
        _form_data = _form['data']
        _form_instance_page_data = _form['form_instance_page_data']
        _email_data = dict(_form_data)
        _email_data.update(_form_instance_page_data)

        _questions_file = constants.FORM_CONFIG_LOCATION + self.home_country + '/' + f_type + '.json'

        _f = gcs.open(_questions_file)
        _contents = _f.read()
        _f.close()
        _form_metadata = json.loads(_contents)

        # _instance_data = {}

        # for _p in form["pages"]:
        #     _is_form_instance_identifier = _p.get("is_form_instance_identifier", "false")
        #     if _is_form_instance_identifier == 'true':
        #         for _q in _p["questions"]:
        #             if 'source' in _q:
        #                 _source_file = constants.FORM_CONFIG_LOCATION + _q['source']
        #                 _id = _q.get("id", "")
        #                 if source_file:
        #                     _f = gcs.open(_source_file)
        #                     _contents = _f.read()
        #                     _f.close()
        #                     _options = json.loads(_contents)
        #                     for _o in _options:
        #                         if _o["value"] == _form_data.get(_id, ""):
        #                             _instance_data.update(option.get("display_data", {}))
        #                             break

        if _form['is_form_submitted']:
            # [START user_confirmation_email]
            try:
                if 'user_confirmation_email' in _form_metadata:
                    _to = self.email
                    _subject = _form_metadata['user_confirmation_email']['subject'].format(**_email_data)
                            
                    _message = """
                        <div style='{font_style}'>
                            {message}
                        </div>
                    """.format(
                        font_style=constants.EMAIL_CONFIG['FONT_STYLE'],
                        message=_form_metadata['user_confirmation_email']['message'].format(**_email_data)
                            # name=self.name,
                            # ttc_dates=_instance_data['dates'],
                            # ttc_country=_instance_data['country'],
                        # )
                    )
                                
                    utils.send_email_using_sendgrid(_to, _form_metadata['from_email'], _subject, _message)
                    logging.info('[send_submission_emails] Sent confirmation email to {to}'.format(to=_to))
            except Exception as e:
                logging.info('[send_submission_emails] Error in user_confirmation_email {0}'.format(e))
            # [END user_confirmation_email]

            # [START owner_confirmation_email]
            try:
                if 'owner_confirmation_email' in _form_metadata:
                    _to = _form_metadata['from_email']
                    _subject = _form_metadata['owner_confirmation_email']['subject'].format(**_email_data)

                    _message = """
                        <div style='{font_style}'>
                            {message}
                        </div>
                    """.format(
                        font_style=constants.EMAIL_CONFIG['FONT_STYLE'],
                        message=_form_metadata['owner_confirmation_email']['message'].format(**_email_data)
                            # name=self.name,
                            # ttc_dates=_instance_data['dates'],
                            # ttc_country=_instance_data['country'],
                        # )
                    )
                                
                    utils.send_email_using_sendgrid(_to, _form_metadata['from_email'], _subject, _message)
                    logging.info('[send_submission_emails] Sent confirmation email to {to}'.format(to=_to))
            except Exception as e:
                logging.info('[send_submission_emails] Error in owner_confirmation_email {0}'.format(e))
            # [END owner_confirmation_email]

            # [START other_confirmation_emails]
            try:
                if 'other_emails' in _form_metadata:
                    for _email_field in _form_metadata['other_emails']:
                        _email_data_arr = []
                        if _email_field in _form_data:
                            _email_data_arr = [_email_data]
                        else:
                            for _tk, _tv in _form_data.items():
                                if isinstance(_tv, list) and len(_tv) > 0 and isinstance(_tv[0], dict) and _email_field in _tv[0]:
                                    for _d in _tv:
                                        _ed = dict(_email_data)
                                        _ed.update(_d)
                                        _ed['app_id'] = constants.app_id
                                        _email_data_arr.append(_ed)
                                    break

                        for _ed in _email_data_arr:
                            _to = _ed[_email_field]
                            _subject = _form_metadata['other_emails'][_email_field]['subject'].format(**_ed)
                                    
                            _message = """
                                <div style='{font_style}'>
                                    {confirmation_email}
                                </div>
                            """.format(
                                font_style=constants.EMAIL_CONFIG['FONT_STYLE'],
                                confirmation_email=_form_metadata['other_emails'][_email_field]['message'].format(**_ed),
                            )

                            utils.send_email_using_sendgrid(_to, _form_metadata['from_email'], _subject, _message)
                            logging.info('[send_submission_emails] Sent confirmation email to {to}'.format(to=_to))
            except Exception as e:
                logging.info('[send_submission_emails] Error in other_confirmation_emails {0}'.format(e))
            # [END other_confirmation_emails]

    def get_form_data(self, f_type, f_instance):
        logging.info('[get_form_data] called f_type = {f_type} f_instance = {f_instance}'.format(**locals()))
        logging.info('[get_form_data] email = ' + self.email)
        _instance = 'default'
        _form_data = {}
        if f_instance and f_instance.strip() != '':
            _instance = f_instance
        if f_type in self.form_data and _instance in self.form_data[f_type]:
            return self.form_data[f_type][_instance]['data']
        return _form_data

    def get_form_instances(self, f_type):
        logging.info('[get_form_instances] called f_type = {f_type}'.format(**locals()))
        _form_instances = {}
        if f_type in self.form_data:
            for _i in self.form_data[f_type]:
                if _i != 'default':
                    _form_instances[_i] = {}
                    _form_instances[_i]['page_data'] = self.form_data[f_type][_i].get('form_instance_page_data', '{}')
                    _form_instances[_i]['display'] = self.form_data[f_type][_i].get('form_instance_display', _i)
        return _form_instances

    def is_form_submitted(self, f_type, f_instance):
        _instance = 'default'
        if f_instance and f_instance.strip() != '':
            _instance = f_instance
        if f_type in self.form_data and _instance in self.form_data[f_type]:
            return self.form_data[f_type][_instance].get('is_form_submitted', False)
        return False

    def is_form_complete(self, f_type, f_instance):
        _instance = 'default'
        if f_instance and f_instance.strip() != '':
            _instance = f_instance
        if f_type in self.form_data and _instance in self.form_data[f_type]:
            return self.form_data[f_type][_instance].get('is_form_complete', False)
        return False

    def is_agreement_accepted(self, f_type, f_instance):
        _instance = 'default'
        if f_instance and f_instance.strip() != '':
            _instance = f_instance
        if f_type in self.form_data and _instance in self.form_data[f_type]:
            return self.form_data[f_type][_instance].get('is_agreement_accepted', False)
        return False

    def send_confirmation_to_candidate(self, f_type, f_instance):
        _instance = 'default'
        if f_instance and f_instance.strip() != '':
            _instance = f_instance
        if f_type in self.form_data and _instance in self.form_data[f_type]:
            return self.form_data[f_type][_instance].get('send_confirmation_to_candidate', False)
        return False

    def set_photo_file(self, photo_file):
        self.photo_file = photo_file

    def get_photo_file(self):
        return self.photo_file

    def get_public_photo_url(self):
        if not hasattr(self, 'public_photo_url') or not self.public_photo_url or self.public_photo_url == "" or self.public_photo_url == constants.DEFAULT_PHOTO_URL:
            self.set_public_photo_url()
        return self.public_photo_url

    def set_public_photo_url(self):
        if not hasattr(self, 'photo_file') or not self.photo_file or self.photo_file == "":
            self.public_photo_url = ''
        else:
            self.public_photo_url = TTCPortalUser.get_public_url_for_image(self.photo_file)

    def set_email(self):
        self.email = username_to_email(self.username)        

    def get_email(self):
        return self.email

    def set_home_country(self, home_country):
        self.home_country = home_country
        self.config['i_home_country'] = home_country

    def get_home_country(self):
        return self.home_country

    def set_config(self, config_params):
        self.config.update(config_params)
        if 'i_home_country' in config_params:
            self.set_home_country(config_params['i_home_country'])

    def get_config(self):
        return self.config

    def get_is_profile_complete(self, f_type):
        if f_type in self.is_profile_complete:
            return self.is_profile_complete[f_type]
        return False
  
    def load_user_data(self, user_email):
        self.email = user_email
        try:
            _f = gcs.open(constants.USER_CONFIG_LOCATION + user_email + '.json')
            _data = _f.read()
            _f.close()
            self.initialize_user(json.loads(_data))
        except gcs.NotFoundError:
            logging.info('[load_user_data] Failed to load the data for user ' + user_email)
            logging.info('[load_user_data] Initializing user with empty dictionary')
            self.initialize_user({'email': user_email})

    def save_user_data(self):
        try:
            _user_data = json.dumps(self.__dict__)

            write_retry_params = gcs.RetryParams(backoff_factor=1.1)
            _f = gcs.open(
                constants.USER_CONFIG_LOCATION + self.email + '.json',
                'w',
                content_type='text/plain',
                options={'x-goog-meta-foo': 'foo',
                'x-goog-meta-bar': 'bar'},
                retry_params=write_retry_params
            )
            _f.write(_user_data)
            _f.close()

        except gcs.Error:
            logging.info('[save_user_data] Failed to save the data for user ')

    def initialize_user(self, data):
        logging.info('[initialize_user] called')
        self.username = data.get('username', '')
        if self.email:
            self.email = data.get('email', self.email)
        else:
            self.email = data.get('email', '')
        self.name = data.get('name', '')
        self.photo_file = data.get('photo_file', '')
        self.public_photo_url = data.get('photo_url', constants.DEFAULT_PHOTO_URL)
        self.current_evaluation_id = data.get('current_evaluation_id', '')
        self.form_data = data.get('form_data', {})
        self.is_profile_complete = data.get('is_profile_complete', {})
        self.home_country = data.get('home_country', '')
        self.config = data.get('config', {})

    def __init__(self, user_email):
        logging.info('[TTCPortalUser __init__] called')
        self.user = None
        self.home_country = None
        self.username = None
        self.email = None
        self.name = None
        self.photo_file = None
        self.public_photo_url = None
        self.current_evaluation_id = None
        self.config = {}
        self.form_data = {}
        self.is_profile_complete = {}
        if user_email:
            self.email = user_email
            self.load_user_data(user_email)

    @staticmethod
    def get_public_url_for_image(p_photo_file):
        if p_photo_file.strip() == "":
            logging.info('[get_public_url_for_image] Empty photo file')
            return ""
        logging.info('[get_public_url_for_image] Getting photo for ' + constants.CLOUD_STORAGE_LOCATION + p_photo_file)
        try:
            _photo_url = images.get_serving_url(
                blobstore.create_gs_key('/gs' + constants.CLOUD_STORAGE_LOCATION + p_photo_file),
                size=500,
                crop=True,
                secure_url=True
            )
        except:
            logging.info('[get_public_url_for_image] Error Getting photo')
            _photo_url = ""
        return _photo_url




#[START UsersService]
class UsersService(webapp2.RequestHandler):
    def post(self):
        _user = users.get_current_user()
        if _user:
            _user_email_addr = _user.email()
            _user_logout_url = users.create_logout_url('/')
            _user_login_url = ""

        if self.request.path == '/users/upload-form-data':
            _form_type = self.request.get('form_type')
            _form_instance = self.request.get('form_instance')
            _form_data = self.request.get('form_data')
            _form_instance_page_data = self.request.get('form_instance_page_data')
            _form_instance_display = self.request.get('form_instance_display')
            _user_home_country = self.request.get('user_home_country_iso')
            if not _user_home_country or _user_home_country.strip() == '':
                try:
                    _user_home_country = self.request.headers['X-AppEngine-Country']
                except Exception as e:
                    _user_home_country = ''
            _ttc_user = TTCPortalUser(_user_email_addr)
            _ttc_user.set_home_country(_user_home_country)
            # logging.info('[root] data\n' + _form_data)
            _ttc_user.set_form_data(_form_type, _form_instance, json.loads(_form_data), json.loads(_form_instance_page_data), _form_instance_display)
            _ttc_user.save_user_data()
        elif self.request.path == '/users/set-config':
            _config_params = json.loads(self.request.get('config_params'))
            _ttc_user = TTCPortalUser(_user_email_addr)
            _ttc_user.set_config(_config_params)
            _ttc_user.save_user_data()


    def get(self):
        _user = users.get_current_user()

        if self.request.path.startswith('/users/reporting/'):
            try:
                _is_cron = self.request.headers['X-Appengine-Cron']
            except Exception as e:
                _is_cron = False

            if _user:
                _user_email_addr = _user.email()
            else:
                _user_email_addr = ""

            if not _is_cron and _user_email_addr not in constants.LIST_OF_ADMINS:
                self.response.write("<b>UN-AUTHORIZED</b>")
            else:
                if self.request.path == '/users/reporting/get-form-data-for-user':
                    _email = self.request.get('email')
                    _form_type = self.request.get('form_type')
                    _form_instance = self.request.get('form_instance')
                    _ttc_user = TTCPortalUser(_email)
                    self.response.write(json.dumps(_ttc_user.get_form_data(_form_type, _form_instance)))
        else:
            if _user:
                _user_email_addr = _user.email()
                _ttc_user = TTCPortalUser(_user_email_addr)
                if self.request.path == '/users/get-form-data':
                    _form_type = self.request.get('form_type')
                    _form_instance = self.request.get('form_instance')
                    self.response.write(json.dumps(_ttc_user.get_form_data(_form_type, _form_instance)))
                elif self.request.path == '/users/get-form-instances':
                    _form_type = self.request.get('form_type')
                    self.response.write(json.dumps(_ttc_user.get_form_instances(_form_type)))
                elif self.request.path == '/users/get-config':
                    self.response.write(json.dumps(_ttc_user.get_config()))
#[END UsersService]

app = webapp2.WSGIApplication(
    [
        ('/users/upload-form-data', UsersService),
        ('/users/get-form-data', UsersService),
        ('/users/get-form-instances', UsersService),
        ('/users/set-config', UsersService),
        ('/users/get-config', UsersService),
        ('/users/reporting/get-form-data-for-user', UsersService),
    ],
    debug=True
)

