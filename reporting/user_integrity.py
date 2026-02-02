
from __future__ import absolute_import

import os
import urllib
import unicodedata
import logging
import base64
import hashlib
import json
import re
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
from pyutils import dt_utils
from pyutils import utils, Utils
from reporting import reporting_utils
from db import ControlParameters

# import gc

class Integrity(webapp2.RequestHandler):
    KEY = 'integrity'

    def get(self):
        try:
            is_cron = self.request.headers['X-Appengine-Cron']
        except Exception as e:
            is_cron = False

        user = users.get_current_user()
        if user:
            user_email_addr = user.email()
        else:
            user_email_addr = ""

        if not is_cron and user_email_addr not in constants.LIST_OF_ADMINS:
            self.response.write("<b>UN-AUTHORIZED</b>")
        else:
            if self.request.path == '/integrity/user-integrity/get-by-user':
                self.response.write(self.get_user_integrity_by_user())
            elif self.request.path in ('/integrity/user-integrity/load', '/jobs/integrity/user-integrity/load'):
                self.load_user_integrity()
            elif self.request.path in ('/integrity/user-integrity/postload', '/jobs/integrity/user-integrity/postload'):
                self.post_load_user_integrity()

    def post(self):
        user = users.get_current_user()
        if user:
            user_email_addr = user.email()
        else:
            user_email_addr = ""

        if user_email_addr not in constants.LIST_OF_ADMINS:
            self.response.write("<b>UN-AUTHORIZED</b>")
        else:
            if self.request.path in ('/integrity/user-integrity/load', '/jobs/integrity/user-integrity/load'):
                self.load_user_integrity()
            elif self.request.path in ('/integrity/user-integrity/postload', '/jobs/integrity/user-integrity/postload'):
                self.post_load_user_integrity()

    def get_user_integrity_by_user(self):
        _f = gcs.open(constants.USER_INTEGRITY_BY_USER)
        _contents = _f.read()
        _f.close()
        return _contents

    def load_user_integrity(self):
        reporting_fields = {
            'i_fname': '',
            'i_lname': '',
            'i_enrolled_people': '',
            'i_org_courses': [
                'i_org_course_from_date',
                'i_org_course_to_date',
                'i_org_course_leadteacher',
                'i_org_course_city',
                'i_org_course_state',
                'i_org_course_leadteacher',
            ],
        }

        ttc_list = reporting_utils.get_ttc_list()

        min_updated_datetime = None
        cparams = ControlParameters.fetch()
        if cparams:
            min_updated_datetime = cparams.user_integrity_last_update_datetime
            if min_updated_datetime:
                logging.info('[load_user_integrity] user_integrity_last_update_datetime = ' + min_updated_datetime.strftime('%Y-%m-%d %H:%M:%S'))
            else:
                logging.info('[load_user_integrity] user_integrity_last_update_datetime = NONE')
        try:
            _f = gcs.stat(constants.USER_INTEGRITY_BY_USER)
            file_updated_datetime = datetime.fromtimestamp(_f.st_ctime)
            if not min_updated_datetime:
                min_updated_datetime = (file_updated_datetime - timedelta(hours=1))
                logging.error('[load_user_integrity] Did not find param for "user_integrity_last_update_datetime". Setting default from update date of ' + constants.USER_INTEGRITY_BY_USER)
            else:
                if file_updated_datetime < min_updated_datetime:
                    min_updated_datetime = (file_updated_datetime - timedelta(hours=1))
            _f = gcs.open(constants.USER_INTEGRITY_BY_USER)
            _user_data_by_email = json.loads(_f.read())
            _f.close()
        except gcs.NotFoundError:
            logging.info('[load_user_integrity] Failed to load the data from old user_integrity')
            logging.info('[load_user_integrity] Initializing user with empty dictionary')
            _user_data_by_email = {}
            min_updated_datetime = None

        if min_updated_datetime:
            logging.info('[load_user_integrity] user_integrity_last_update_datetime = ' + min_updated_datetime.strftime('%Y-%m-%d %H:%M:%S'))

        current_datetime = datetime.now()
        _user_files = Utils.list_files(
            # prefix=constants.USER_CONFIG_FOLDER,
            prefix=constants.USER_CONFIG_LOCATION,
            min_updated_datetime=min_updated_datetime,
        )

        # _user_files = gcs.listbucket(constants.USER_CONFIG_LOCATION)
        # _user_data_by_email = {}
        for _f in _user_files:
            if _f.filename.endswith('.json') and not '/summary/' in _f.filename and not '/integrity/' in _f.filename:
                # logging.info('[load_user_integrity] Reading file ' + _f.filename)
                gcs_file = gcs.open(_f.filename)
                _contents = gcs_file.read()
                if _contents and _contents.strip() != '':
                    _ud = json.loads(_contents)
                    _ue = _ud.get('email', '')
                    gcs_file.close()
                    if 'form_data' in _ud:
                        for _ft in _ud['form_data']:
                            if _ft != 'ttc_application':
                                continue
                            for _fi_raw in _ud['form_data'][_ft]:
                                if _fi_raw != 'default':
                                    _fd = _ud['form_data'][_ft][_fi_raw]
                                    _fd['form_instance'] = _fi_raw
                                    if 'last_update_datetime' in _fd:
                                        _fd['last_update_datetime_est'] = dt_utils.utc_to_timezone(
                                            datetime.strptime(
                                                _fd['last_update_datetime'], 
                                                "%Y-%m-%d %H:%M:%S"
                                            ), 
                                            dt_utils.Eastern
                                        ).strftime("%Y-%m-%d %H:%M:%S")

                                    if _fd['last_update_datetime_est'] < datetime.strftime(datetime.now() - timedelta(constants.DATA_RETENTION_DAYS), "%Y-%m-%d %H:%M:%S"):
                                        continue

                                    # [START] [reporting_fields] Processing application status
                                    app_status, eval_status = reporting_utils.get_reporting_status(
                                        _ft, 
                                        _fd.get('is_form_submitted', False),
                                        _fd.get('is_form_complete', False),
                                    )
                                    # [END] [reporting_fields] Processing application status

                                    # [START] [photo_url] Setting photo public URL
                                    # [END] [photo_url] Setting photo public URL

                                    # [START] [reporting_fields] Processing form_instance_page_data
                                    if 'form_instance_page_data' in _fd and 'i_ttc_country_and_dates' in _fd['form_instance_page_data']:
                                        _fd['ttc_metadata'] = ttc_list.get(_fd['form_instance_page_data']['i_ttc_country_and_dates'], {})
                                    # [END] [reporting_fields] Processing form_instance_page_data

                                    # [START] [reporting_fields] Processing all answers
                                    if 'data' in _fd:
                                        _fd_data = {}
                                        for _q, _qa in _fd['data'].items():
                                            # Storing only whitelisted fields
                                            if _q in reporting_fields:
                                                _qa2 = _qa
                                                if isinstance(_qa, dict) and isinstance(reporting_fields[_q], list):
                                                    _qa2 = {}
                                                    for _tq, _tqa in _qa.items():
                                                        if _tq in reporting_fields[_q]:
                                                            _qa2[_tq] = _tqa
                                                _fd_data[_q] = _qa2

                                        _fd['data'] = _fd_data
                                    # [END] [reporting_fields] Processing all answers

                                    _fi_email = None
                                    if '-' in _fi_raw:
                                        _fi_arr = _fi_raw.split('-')
                                        # Checking against 2nd value, since sometimes people enter names instead of emails
                                        # That can throw off this logic. So in such cases we just take the first value as the email.
                                        if '@' not in _fi_arr[1]:
                                            _fi_email = _fi_arr[0]
                                            _fi = _fi_arr[1]
                                        else:
                                            _fi = _fi_arr[0]
                                            _fi_email = _fi_arr[1]
                                    else:
                                        _fi = _fi_raw

                                    if _ue not in _user_data_by_email:
                                        _user_data_by_email[_ue] = {}
                                    if _ft not in _user_data_by_email[_ue]:
                                        _user_data_by_email[_ue][_ft] = {}
                                        _user_data_by_email[_ue][_ft][Integrity.KEY] = {}
                                    if _fi not in _user_data_by_email[_ue][_ft]:
                                        _user_data_by_email[_ue][_ft][_fi] = {}

                                    if _fi_email:
                                        _user_data_by_email[_ue][_ft][_fi][_fi_email] = _fd
                                    else:
                                        _user_data_by_email[_ue][_ft][_fi] = _fd


        # [START KEYRESET] Clearing past evaluation assignments
        for _e in _user_data_by_email:
            if 'ttc_application' in _user_data_by_email[_e]:
                _user_data_by_email[_e]['ttc_application'][Integrity.KEY]['enrolled_matches'] = {}
                _user_data_by_email[_e]['ttc_application'][Integrity.KEY]['org_course_matches'] = {}
        # [END KEYRESET]

        # logging.info('[load_user_integrity] Processing data')

        # logging.info('[load_user_integrity] Processing applications')
        for _c1e in _user_data_by_email:
            for _c1fi in _user_data_by_email[_c1e].get('ttc_application', {}):
                if _c1fi == 'default':
                    continue
                # logging.info('[load_user_integrity] Processing application for ' + _c1e)
                _c1 = _user_data_by_email[_c1e]['ttc_application'][_c1fi]
                _c1d = _c1.get('data', {})
                _c1fn = _c1d.get('i_fname','').strip().lower()
                _c1ln = _c1d.get('i_lname','').strip().lower()
                _c1n = _c1fn + " " + _c1ln

                for _c2e in _user_data_by_email:
                    if _c1e == _c2e:
                        continue
                    # logging.info('[load_user_integrity][' + _c1e + '] Comparing against application for: ' + _c2e)
                    for _c2fi in _user_data_by_email[_c2e].get('ttc_application', {}):
                        _c2 = _user_data_by_email[_c2e]['ttc_application'][_c2fi]
                        _c2d = _c2.get('data', {})
                        _c2fn = _c2d.get('i_fname','').strip().lower()
                        _c2ln = _c2d.get('i_lname','').strip().lower()
                        _c2n = _c2fn + " " + _c2ln

                        if _c1n == _c2n:
                            continue

                        for _c1en in _c1d.get('i_enrolled_people', {}):
                            for _c2en in _c2d.get('i_enrolled_people', {}):
                                is_matched = False
                                _ee1 = _c1en['i_enrollment_email'].strip().lower()
                                _ee2 = _c2en['i_enrollment_email'].strip().lower()
                                _en1 = _c1en['i_enrollment_name'].strip().lower()
                                _en2 = _c2en['i_enrollment_name'].strip().lower()
                                _ec1 = _c1en['i_enrollment_city'].strip().lower()
                                _ec2 = _c2en['i_enrollment_city'].strip().lower()
                                _es1 = _c1en['i_enrollment_state'].strip().lower()
                                _es2 = _c2en['i_enrollment_state'].strip().lower()
                                if '@' in _ee1 and _ee1 == _ee2:
                                    is_matched = True
                                if _en1 == _en2 and _ec1 == _ec2 and _es1 == _es2:
                                    is_matched = True

                                if is_matched:
                                    if Integrity.KEY not in _user_data_by_email[_c1e]['ttc_application']:
                                        _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY] = {}
                                    if 'enrolled_matches' not in _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]:
                                        _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['enrolled_matches'] = {}
                                    if _c2e not in _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['enrolled_matches']:
                                        _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['enrolled_matches'][_c2e] = set()
                                    _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['enrolled_matches'][_c2e].add("{_en2} <{_ee2}>".format(**locals()))

                        for _c1en in _c1d.get('i_org_courses', {}):
                            _ofd1 = _c1en['i_org_course_from_date'].strip()
                            _otd1 = _c1en['i_org_course_to_date'].strip()
                            _ot1 = _c1en['i_org_course_leadteacher'].strip().lower()
                            _oc1 = _c1en['i_org_course_city'].strip().lower()
                            _os1 = _c1en['i_org_course_state'].strip().lower()

                            _olt1 = _c1en["i_org_course_leadteacher"].strip().lower()
                            _re = re.search("^[^a-z]{0,3}([a-z]+ [a-z]+)", _olt1, re.IGNORECASE)
                            if _re:
                                _oltn1 = _re.group(1)
                            else:
                                _oltn1 = ''

                            for _c2en in _c2d.get('i_org_courses', {}):
                                is_matched = False
                                _ofd2 = _c2en['i_org_course_from_date'].strip()
                                _otd2 = _c2en['i_org_course_to_date'].strip()
                                _ot2 = _c2en['i_org_course_leadteacher'].strip().lower()
                                _oc2 = _c2en['i_org_course_city'].strip().lower()
                                _os2 = _c2en['i_org_course_state'].strip().lower()

                                _olt2 = _c2en["i_org_course_leadteacher"].strip().lower()
                                _re = re.search("^[^a-z]{0,3}([a-z]+ [a-z]+)", _olt2, re.IGNORECASE)
                                if _re:
                                    _oltn2 = _re.group(1)
                                else:
                                    _oltn2 = ''

                                if (
                                    # _oc1 != 'online' and
                                    # _os1 != 'online' and
                                    (_ofd1 == _ofd2 or _otd1 == _otd2) and 
                                    _oc1 == _oc2 and 
                                    _os1 == _os2 and
                                    _oltn1 and
                                    _oltn2 and
                                    (
                                        _oltn1 == _oltn2 or
                                        _oltn1 in _olt2 or
                                        _oltn2 in _olt1
                                    )
                                ):
                                    is_matched = True

                                if is_matched:
                                    if Integrity.KEY not in _user_data_by_email[_c1e]['ttc_application']:
                                        _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY] = {}
                                    if 'org_course_matches' not in _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]:
                                        _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['org_course_matches'] = {}
                                    if _c2e not in _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['org_course_matches']:
                                        _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['org_course_matches'][_c2e] = set()
                                    _user_data_by_email[_c1e]['ttc_application'][Integrity.KEY]['org_course_matches'][_c2e].add("{_ofd2} - {_otd2} ({_oc2}, {_os2} - {_oltn2})".format(**locals()))

        # ----------------------------------------------------------------------------------------
        write_retry_params = gcs.RetryParams(backoff_factor=1.1)
        _f = gcs.open(
            constants.USER_INTEGRITY_BY_USER,
            'w',
            content_type='text/plain',
            options={'x-goog-meta-foo': 'foo',
            'x-goog-meta-bar': 'bar'},
            retry_params=write_retry_params
        )
        _f.write(json.dumps(_user_data_by_email, default=utils.json_dumps_set_default))
        _f.close()

        ControlParameters.create(
            {
                'user_integrity_last_update_datetime': current_datetime,
            }
        )
    # ----------------------------------------------------------------------------------------

    def post_load_user_integrity(self):
        try:
            _f = gcs.open(constants.USER_INTEGRITY_BY_USER)
            _user_data_by_email = json.loads(_f.read())
            _f.close()
        except gcs.NotFoundError:
            logging.info('[post_load_user_integrity] Failed to load the data from old user_integrity')
            logging.info('[post_load_user_integrity] Initializing user with empty dictionary')
            _user_data_by_email = {}

        enrolledCSV = "Applicant Name,Applicant Email,Enrolled Name,Enrolled Email\n"
        for _c1e in _user_data_by_email:
            for _c1fi in _user_data_by_email[_c1e].get('ttc_application', {}):
                if _c1fi == 'default':
                    continue
                logging.info('[post_load_user_integrity] Processing application for ' + _c1e)
                _c1 = _user_data_by_email[_c1e]['ttc_application'][_c1fi]
                _c1d = _c1.get('data', {})
                _c1fn = _c1d.get('i_fname','').strip().lower()
                _c1ln = _c1d.get('i_lname','').strip().lower()
                _c1n = _c1fn + " " + _c1ln
                enrolledCSV += u"{_c1n},{_c1e},,\n".format(**locals())
                for _c1en in _c1d.get('i_enrolled_people', {}):
                    _ee1 = _c1en['i_enrollment_email'].strip().lower()
                    _en1 = _c1en['i_enrollment_name'].strip().lower()
                    enrolledCSV += u",,{_en1},{_ee1}\n".format(**locals())

        write_retry_params = gcs.RetryParams(backoff_factor=1.1)
        _fecsv = gcs.open(
            constants.APPLICANT_ENROLLED_LIST,
            'w',
            content_type='text/plain',
            options={'x-goog-meta-foo': 'foo',
            'x-goog-meta-bar': 'bar'},
            retry_params=write_retry_params
        )
        import unicodedata
        enrolledCSV = unicodedata.normalize('NFKD', enrolledCSV).encode('ascii', 'ignore')
        _fecsv.write(enrolledCSV)
        # logging.info('[load_user_integrity] Processing applications')
        _fecsv.close()
    # ----------------------------------------------------------------------------------------

#[END Integrity]

app = webapp2.WSGIApplication(
    [
        ('/integrity/user-integrity/load', Integrity),
        ('/integrity/user-integrity/get-by-user', Integrity),
        ('/jobs/integrity/user-integrity/load', Integrity),
        ('/jobs/integrity/user-integrity/postload', Integrity),
    ],
    debug=True
)

