
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

class Reporting(webapp2.RequestHandler):
    KEY = 'reporting'

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
            if self.request.path == '/reporting/user-summary/get-by-user':
                self.response.write(self.get_user_summary_by_user())
            elif self.request.path in ('/reporting/user-summary/load', '/jobs/reporting/user-summary/load'):
                self.load_user_summary()

    def post(self):
        user = users.get_current_user()
        if user:
            user_email_addr = user.email()
        else:
            user_email_addr = ""

        if user_email_addr not in constants.LIST_OF_ADMINS:
            self.response.write("<b>UN-AUTHORIZED</b>")
        else:
            if self.request.path in ('/reporting/user-summary/load', '/jobs/reporting/user-summary/load'):
                self.load_user_summary()

    def get_user_summary_by_user(self):
        _f = gcs.open(constants.USER_SUMMARY_BY_USER)
        _contents = _f.read()
        _f.close()
        return _contents

    def load_user_summary(self):
        reporting_fields = {
            'dates',
            'Dates',
            'i_address_city',
            'i_address_state',
            'i_address_country',
            'i_cellphone',
            'i_course_start',
            'i_course_wishlist',
            'i_course_wishlist_artexcel',
            'i_course_wishlist_hp',
            'i_course_wishlist_yes',
            'i_course_wishlist_yp',
            'i_email_aol',
            'i_email_other',
            'i_enrollment',
            'i_fname',
            'i_homephone',
            'i_last1year_introtalks',
            'i_lname',
            'i_name',
            'i_prettc_date',
            'i_prettc_location',
            'i_prettc_teacher',
            'i_special_interest_groups',
            'i_ttc_country_and_dates',
            'i_ttc_graduate_name',
            'i_volunteer_email',
            'i_volunteer_name',
            'i_volunteer_teaching_readiness',
            'i_youthteacher',
            'i_ttc_dates',
            'i_ttc_location',
            'i_course_start',
            'i_date_of_birth',
            'i_gender',
            'i_health_psychiatrist',
            'i_volunteer_mental_fitness',
            'i_course_organized_count',
            'i_course_assisted_count',
        }

        ttc_list = reporting_utils.get_ttc_list()

        min_updated_datetime = None
        cparams = ControlParameters.fetch()
        if cparams:
            min_updated_datetime = cparams.user_summary_last_update_datetime
            logging.info('[load_user_summary] user_summary_last_update_datetime = ' + min_updated_datetime.strftime('%Y-%m-%d %H:%M:%S'))

        try:
            _f = gcs.stat(constants.USER_SUMMARY_BY_USER)
            file_updated_datetime = datetime.fromtimestamp(_f.st_ctime)
            if not min_updated_datetime:
                min_updated_datetime = (file_updated_datetime - timedelta(hours=1))
                logging.error('[load_user_summary] Did not find param for "user_summary_last_update_datetime". Setting default from update date of ' + constants.USER_SUMMARY_BY_USER)
            else:
                if file_updated_datetime < min_updated_datetime:
                    min_updated_datetime = (file_updated_datetime - timedelta(hours=1))
            _f = gcs.open(constants.USER_SUMMARY_BY_USER)
            _user_data_by_email = json.loads(_f.read())
            _f.close()
        except gcs.NotFoundError:
            logging.info('[load_user_summary] Failed to load the data from old user_summary')
            logging.info('[load_user_summary] Initializing user with empty dictionary')
            _user_data_by_email = {}
            min_updated_datetime = None

        if min_updated_datetime:
            logging.info('[load_user_summary] user_summary_last_update_datetime = ' + min_updated_datetime.strftime('%Y-%m-%d %H:%M:%S'))

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
                # logging.info('[load_user_summary] Reading file ' + _f.filename)
                gcs_file = gcs.open(_f.filename)
                _contents = gcs_file.read()
                if _contents and _contents.strip() != '':
                    _ud = json.loads(_contents)
                    _ue = _ud.get('email', '')
                    gcs_file.close()
                    if 'form_data' in _ud:
                        for _ft in _ud['form_data']:
                            for _fi_raw in _ud['form_data'][_ft]:
                                if _fi_raw != 'default':
                                    _fd = _ud['form_data'][_ft][_fi_raw]
                                    _fd['form_instance'] = _fi_raw
                                    _fd[Reporting.KEY] = {}
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
                                    _fd[Reporting.KEY]['reporting_status'] = app_status
                                    _fd[Reporting.KEY]['evaluations_reporting_status'] = eval_status
                                    # [END] [reporting_fields] Processing application status

                                    # [START] [photo_url] Setting photo public URL
                                    # [END] [photo_url] Setting photo public URL

                                    # [START] [reporting_fields] Processing form_instance_page_data
                                    if 'form_instance_page_data' in _fd and 'i_ttc_country_and_dates' in _fd['form_instance_page_data']:
                                        _fd['ttc_metadata'] = ttc_list.get(_fd['form_instance_page_data']['i_ttc_country_and_dates'], {})
                                    # [END] [reporting_fields] Processing form_instance_page_data

                                    # [START] [reporting_fields] Processing all answers
                                    _fd[Reporting.KEY]['prereq_no_count'] = 0
                                    if 'data' in _fd:
                                        _fd_data = {}
                                        for _q, _qa in _fd['data'].items():
                                            # Storing only whitelisted fields
                                            if _q in reporting_fields:
                                                _fd_data[_q] = _qa

                                            # Processing pre-requisites answered as no
                                            if re.match(r"i_prereq[0-9]+$", _q) is not None:
                                                if isinstance(_qa, basestring) and _qa == 'no':
                                                    _fd[Reporting.KEY]['prereq_no_count'] += 1

                                            # Adding counts for lists
                                            if isinstance(_qa, list):
                                                _fd[Reporting.KEY][utils.str_remove_prefix(_q, 'i_') + '_count'] = len(_qa)

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
                                        _user_data_by_email[_ue][_ft][Reporting.KEY] = {}
                                    if _fi not in _user_data_by_email[_ue][_ft]:
                                        _user_data_by_email[_ue][_ft][_fi] = {}

                                    if _fi_email:
                                        _user_data_by_email[_ue][_ft][_fi][_fi_email] = _fd
                                    else:
                                        _user_data_by_email[_ue][_ft][_fi] = _fd
                                    
                                    # gc.collect()
        
        # [START KEYRESET] Clearing past evaluation assignments
        for _e in _user_data_by_email:
            if 'ttc_application' in _user_data_by_email[_e]:
                _user_data_by_email[_e]['ttc_application'][Reporting.KEY]['lifetime_evaluations'] = {}
                _user_data_by_email[_e]['ttc_application'][Reporting.KEY]['lifetime_eval_teaching_readiness'] = {}
                _user_data_by_email[_e]['ttc_application'][Reporting.KEY]['lifetime_eval_teaching_readiness_not_ready_now_count'] = 0
                _user_data_by_email[_e]['ttc_application'][Reporting.KEY]['lifetime_evaluator_ratings_below_3'] = 0
                _user_data_by_email[_e]['ttc_application'][Reporting.KEY]['lifetime_evaluations_submitted_count'] = 0
                _user_data_by_email[_e]['ttc_application'][Reporting.KEY]['lifetime_latest_evaluation_datetime_est'] = ''
                for _fi in _user_data_by_email[_e]['ttc_application']:
                    # handling some edge cases in past where evaluation got saved as application
                    if _fi != Reporting.KEY and Reporting.KEY in _user_data_by_email[_e]['ttc_application'][_fi]:
                        _user_data_by_email[_e]['ttc_application'][_fi][Reporting.KEY]['evaluations'] = {}
                        _user_data_by_email[_e]['ttc_application'][_fi][Reporting.KEY]['eval_teaching_readiness'] = {}
                        _user_data_by_email[_e]['ttc_application'][_fi][Reporting.KEY]['eval_teaching_readiness_not_ready_now_count'] = 0
                        _user_data_by_email[_e]['ttc_application'][_fi][Reporting.KEY]['evaluator_ratings_below_3'] = 0
                        _user_data_by_email[_e]['ttc_application'][_fi][Reporting.KEY]['evaluations_submitted_count'] = 0
                        _user_data_by_email[_e]['ttc_application'][_fi][Reporting.KEY]['latest_evaluation_datetime_est'] = ''

            for _fi in _user_data_by_email[_e].get('ttc_evaluation', {}):
                for _ve in _user_data_by_email[_e]['ttc_evaluation'][_fi]:
                    _user_data_by_email[_e]['ttc_evaluation'][_fi][_ve][Reporting.KEY]['lifetime_reporting_matched_ttc_list'] = set()
                    _user_data_by_email[_e]['ttc_evaluation'][_fi][_ve][Reporting.KEY]['is_reporting_matched'] = 'N'

            if 'post_ttc_self_evaluation_form' in _user_data_by_email[_e]:
                _user_data_by_email[_e]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'] = {}
                _user_data_by_email[_e]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_submitted_count'] = 0
                _user_data_by_email[_e]['post_ttc_self_evaluation_form'][Reporting.KEY]['latest_evaluation_datetime_est'] = ''

            for _fi in _user_data_by_email[_e].get('post_ttc_feedback_form', {}):
                for _ve in _user_data_by_email[_e]['post_ttc_feedback_form'][_fi]:
                    _user_data_by_email[_e]['post_ttc_feedback_form'][_fi][_ve][Reporting.KEY]['is_reporting_matched'] = 'N'

            if 'post_sahaj_ttc_self_evaluation_form' in _user_data_by_email[_e]:
                _user_data_by_email[_e]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'] = {}
                _user_data_by_email[_e]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_submitted_count'] = 0
                _user_data_by_email[_e]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['latest_evaluation_datetime_est'] = ''

            for _fi in _user_data_by_email[_e].get('post_sahaj_ttc_feedback_form', {}):
                for _ve in _user_data_by_email[_e]['post_sahaj_ttc_feedback_form'][_fi]:
                    _user_data_by_email[_e]['post_sahaj_ttc_feedback_form'][_fi][_ve][Reporting.KEY]['is_reporting_matched'] = 'N'
        # [END KEYRESET]

        # logging.info('[load_user_summary] Processing data')

        # logging.info('[load_user_summary] Processing evaluations')
        for _t in _user_data_by_email:
            for _fi in _user_data_by_email[_t].get('ttc_evaluation', {}):
                if _fi == 'default':
                    continue
                # logging.info('[load_user_summary] Processing evaluation instance: ' + _fi)
                for _ve in _user_data_by_email[_t]['ttc_evaluation'][_fi]:
                    # logging.info('[load_user_summary] Processing evaluation for: ' + _ve)
                    _e = _user_data_by_email[_t]['ttc_evaluation'][_fi][_ve]
                    # set logged in email
                    _e['email'] = _t
                    _ed = _e.get('data', {})
                    _ed.update(_e.get('form_instance_page_data', {}))
                    _vn = _ed.get('i_volunteer_name', '').strip().lower()
                    _tn = _ed.get('i_name').strip()
                    # _ve = _ed.get('i_volunteer_email', '').strip()
                    # logging.info('[load_user_summary] Processing evaluation from: ' + _t + ' for ' + _vn + ' [' + _ve + ']')
                    _user_data_by_email[_t]['ttc_evaluation'][_fi][_ve][Reporting.KEY]['is_reporting_matched'] = 'N'
                    for _c in _user_data_by_email:
                        for _afi in _user_data_by_email[_c].get('ttc_application', {}):
                            if _afi == Reporting.KEY:
                                continue
                            _a = _user_data_by_email[_c]['ttc_application'][_afi]
                            _ad = _a.get('data', {})
                            _afn = _ad.get('i_fname','').strip().lower()
                            _aln = _ad.get('i_lname','').strip().lower()
                            # If first name has two words
                            _afnArr = _afn.split()
                            if _afn and len(_afnArr) > 1:
                                # getting first word without special characters
                                _afn2 = ''.join(e for e in _afnArr[0] if e.isalnum())
                                # getting second word without special characters
                                _afn3 = ''.join(e for e in _afnArr[1] if e.isalnum())
                                # getting last name
                                _aln2 = _aln.split()[-1] if _aln else ''
                            else:
                                _afn2 = ''; _afn3 = ''; _aln2 = ''

                            # If last name has two words
                            _alnArr = _aln.split()
                            if _aln and len(_alnArr) > 1:
                                # getting first word without special characters
                                _aln4 = ''.join(e for e in _alnArr[0] if e.isalnum())
                                # getting second word without special characters
                                _aln5 = ''.join(e for e in _alnArr[1] if e.isalnum())
                            else:
                                _aln4 = ''; _aln5 = ''

                            # Compare only first name if the volunteer name has only one word
                            # Checking if volunteer email is valid to avoid first name only comparison where last name is in volunteer email
                            if len(_vn.split()) == 1 and '@' in _ve:
                                _an = _afn
                                # If first name has two words, also compare only against first word
                                _an2 = _afn2
                                # If first name has two words, also compare only against second word
                                _an3 = _afn3
                                _an4 = ''
                                _an5 = ''
                            else:
                                _an = (_afn + ' ' + _aln)
                                if _afn2 and _afn3 and _aln2:
                                    # If first name has two words, also compare only against first word
                                    _an2 = (_afn2 + ' ' + _aln2)
                                    # If first name has two words, also compare only against second word
                                    _an3 = (_afn3 + ' ' + _aln2)
                                else:
                                    _an2 = ''; _an3 = ''
                                if _aln4 and _aln5:
                                    # If last name has two words, also compare only against first word
                                    _an4 = (_afn + ' ' + _aln4)
                                    # If last name has two words, also compare only against second word
                                    _an5 = (_afn + ' ' + _aln5)
                                else:
                                    _an4 = ''; _an5 = ''

                            _aea = _ad.get("i_email_aol", '').strip().lower()
                            _aeo = _ad.get("i_email_other", '').strip().lower()

                            # logging.info('[load_user_summary] Checking match with candidate: ' + _an + ' / ' + _an2 + ' [' + _c + ']')

                            if (
                                # Compare with candidates login email
                                (_ve.lower() == _c.lower()) or

                                # Compare email address with AOL and other email addresses
                                (_aea and _ve.lower() == _aea.lower()) or
                                (_aeo and _ve.lower() == _aeo.lower()) or

                                # Comparing against _an
                                # Compare name with allowed error of 1
                                (_vn and utils.levenshteinB(_an, _vn, 1, True)) or
                                # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                (_ve and '@' not in _ve and _vn and utils.levenshteinB(_an, _vn+' '+_ve, 1, True)) or
                                # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                (_ve and '@' not in _ve and utils.levenshteinB(_an, _ve, 1, True)) or

                                # Comparing against _an2
                                # Compare name with allowed error of 1
                                (_an2 and _an2 != _an and _vn and utils.levenshteinB(_an2, _vn, 1, True)) or
                                # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                (_an2 and _an2 != _an and _ve and '@' not in _ve and _vn and utils.levenshteinB(_an2, _vn+' '+_ve, 1, True)) or
                                # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                (_an2 and _an2 != _an and _ve and '@' not in _ve and utils.levenshteinB(_an2, _ve, 1, True)) or

                                # Comparing against _an3
                                # Compare name with allowed error of 1
                                (_an3 and _an3 != _an and _vn and utils.levenshteinB(_an3, _vn, 1, True)) or
                                # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                (_an3 and _an3 != _an and _ve and '@' not in _ve and _vn and utils.levenshteinB(_an3, _vn+' '+_ve, 1, True)) or
                                # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                (_an3 and _an3 != _an and _ve and '@' not in _ve and utils.levenshteinB(_an3, _ve, 1, True)) or

                                # Comparing against _an4
                                # Compare name with allowed error of 1
                                (_an4 and _an4 != _an and _vn and utils.levenshteinB(_an4, _vn, 1, True)) or
                                # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                (_an4 and _an4 != _an and _ve and '@' not in _ve and _vn and utils.levenshteinB(_an4, _vn+' '+_ve, 1, True)) or
                                # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                (_an4 and _an4 != _an and _ve and '@' not in _ve and utils.levenshteinB(_an4, _ve, 1, True)) or

                                # Comparing against _an5
                                # Compare name with allowed error of 1
                                (_an5 and _an5 != _an and _vn and utils.levenshteinB(_an5, _vn, 1, True)) or
                                # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                (_an5 and _an5 != _an and _ve and '@' not in _ve and _vn and utils.levenshteinB(_an5, _vn+' '+_ve, 1, True)) or
                                # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                (_an5 and _an5 != _an and _ve and '@' not in _ve and utils.levenshteinB(_an5, _ve, 1, True))
                            ):
                                # ADD to evaluations
                                if _fi == _afi:
                                    if _t not in _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['evaluations']:
                                        _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['evaluations'][_t] = {}
                                    if _ve not in _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['evaluations'][_t]:
                                        _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['evaluations'][_t][_ve] = _tn
                                        _process_current = True
                                else:
                                    _process_current = False

                                # ADD to lifetime_evaluations
                                if _fi not in _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluations']:
                                    _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluations'][_fi] = {}
                                if _t not in _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluations'][_fi]:
                                    _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluations'][_fi][_t] = {}
                                if _ve not in _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluations'][_fi][_t]:
                                    _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluations'][_fi][_t][_ve] = _tn
                                    _process_lifetime = True
                                else:
                                    _process_lifetime = False

                                # Add latest evaluation datetime
                                if 'last_update_datetime' in _e:
                                    latest_evaluation_datetime_est = dt_utils.utc_to_timezone(
                                        datetime.strptime(
                                            _e['last_update_datetime'], 
                                            "%Y-%m-%d %H:%M:%S"
                                        ), 
                                        dt_utils.Eastern
                                    ).strftime("%Y-%m-%d %H:%M:%S")
                                    if _process_current:
                                        if _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['latest_evaluation_datetime_est'] < latest_evaluation_datetime_est:
                                            _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['latest_evaluation_datetime_est'] = latest_evaluation_datetime_est
                                    if _process_lifetime:
                                        if _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_latest_evaluation_datetime_est'] < latest_evaluation_datetime_est:
                                            _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_latest_evaluation_datetime_est'] = latest_evaluation_datetime_est

                                # If evaluation is submitted increment the count.
                                if _e.get('is_form_submitted', False):
                                    if _process_current:
                                        _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['evaluations_submitted_count'] += 1
                                    if _process_lifetime:
                                        _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluations_submitted_count'] += 1

                                    # [START] [reporting_fields] Processing readiness by evaluators
                                    _teaching_readiness = _ed.get('i_volunteer_teaching_readiness', '')
                                    if _teaching_readiness != '':
                                        if _process_current:
                                            if _teaching_readiness not in _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['eval_teaching_readiness']:
                                                _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['eval_teaching_readiness'][_teaching_readiness] = 1
                                            else:
                                                _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['eval_teaching_readiness'][_teaching_readiness] += 1

                                        if _process_lifetime:
                                            if _teaching_readiness not in _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_eval_teaching_readiness']:
                                                _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_eval_teaching_readiness'][_teaching_readiness] = 1
                                            else:
                                                _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_eval_teaching_readiness'][_teaching_readiness] += 1

                                        if _teaching_readiness != 'ready_now':
                                            if _process_current:
                                                _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['eval_teaching_readiness_not_ready_now_count'] += 1
                                            if _process_lifetime:
                                                _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_eval_teaching_readiness_not_ready_now_count'] += 1
                                    # [END] [reporting_fields] Processing readiness by evaluators
                                    
                                    # [START] [reporting_fields] Processing ratings by evaluator
                                    for _q in _ed:
                                        if _q.startswith('i_volunteer_rating_') and not _q.endswith('_question') and not _q.endswith('_explanation'):
                                            try:
                                                _rating = int(_ed[_q])
                                            except ValueError:
                                                _rating = None
                                            if _rating <= 2:
                                                if _process_current:
                                                    _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['evaluator_ratings_below_3'] += 1
                                                if _process_lifetime:
                                                    _user_data_by_email[_c]['ttc_application'][Reporting.KEY]['lifetime_evaluator_ratings_below_3'] += 1
                                    # [END] [reporting_fields] Processing ratings by evaluator

                                # [START] [reporting_fields] Processing application status
                                # If no of submitted evaluations touches 3, then set status to complete
                                app_status, eval_status = reporting_utils.get_reporting_status(
                                    'ttc_application', 
                                    _a.get('is_form_submitted', False),
                                    _a.get('is_form_complete', False),
                                    _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY].get('evaluations_submitted_count', 0),
                                    _user_data_by_email[_c]['ttc_application'][Reporting.KEY].get('lifetime_evaluations_submitted_count', 0),
                                )
                                _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['reporting_status'] = app_status
                                _user_data_by_email[_c]['ttc_application'][_afi][Reporting.KEY]['evaluations_reporting_status'] = eval_status
                                # [END] [reporting_fields] Processing application status

                                # logging.info('[load_user_summary] Matched with candidate: ' + _c)

                                if _process_current:
                                    _user_data_by_email[_t]['ttc_evaluation'][_fi][_ve][Reporting.KEY]['is_reporting_matched'] = 'Y'
                                _user_data_by_email[_t]['ttc_evaluation'][_fi][_ve][Reporting.KEY]['is_lifetime_reporting_matched'] = 'Y'
                                _user_data_by_email[_t]['ttc_evaluation'][_fi][_ve][Reporting.KEY]['lifetime_reporting_matched_ttc_list'].add(_afi)
                                # break


            # logging.info('[load_user_summary] Processing post TTC evaluations')
            for _fi in _user_data_by_email[_t].get('post_ttc_feedback_form', {}):
                if _fi != 'default':
                    # logging.info('[load_user_summary] Processing evaluation instance: ' + _fi)
                    for _ve in _user_data_by_email[_t]['post_ttc_feedback_form'][_fi]:
                        # logging.info('[load_user_summary] Processing evaluation for: ' + _ve)
                        _e = _user_data_by_email[_t]['post_ttc_feedback_form'][_fi][_ve]
                        # set logged in email
                        _e['email'] = _t
                        _ed = _e.get('data', {})
                        _ed.update(_e.get('form_instance_page_data', {}))
                        _vn = _ed.get('i_ttc_graduate_name', '').strip().lower()
                        _cd = _ed.get('i_course_start', '').strip()
                        _tn = _ed.get('i_fname').strip() + ' ' + _ed.get('i_lname').strip()
                        try:
                            if len(_cd) == 10:
                                _t_cd = datetime.strptime(_cd, '%m/%d/%Y')
                            else:
                                _t_cd = datetime.strptime(_cd, '%m/%d/%y')
                            _cd = _t_cd
                        except Exception as exception:
                            pass
                        # _ve = _ed.get('i_volunteer_email', '').strip()
                        # logging.info('[load_user_summary] Processing evaluation from: ' + _t + ' for ' + _vn + ' [' + _ve + ']')
                        _c_match = ''
                        for _c in _user_data_by_email:
                            for _sefi in _user_data_by_email[_c].get('post_ttc_self_evaluation_form', {}):
                                if _sefi == Reporting.KEY:
                                    continue
                                # logging.info('[load_user_summary] Checking match with candidate: ' + _c)
                                _a = _user_data_by_email[_c]['post_ttc_self_evaluation_form'][_sefi]
                                _ad = _a.get('data', {})
                                _afn = _ad.get('i_fname','').strip().lower()
                                _aln = _ad.get('i_lname','').strip().lower()
                                _afn2 = _afn.split()[0] if _afn else ''
                                _aln2 = _aln.split()[-1] if _aln else ''
                                _acd = _ad.get('i_course_start', '').strip()
                                try:
                                    if len(_acd) == 10:
                                        _t_acd = datetime.strptime(_acd, '%m/%d/%Y')
                                    else:
                                        _t_acd = datetime.strptime(_acd, '%m/%d/%y')
                                    _acd = _t_acd
                                except Exception as exception:
                                    pass
                                # Compare only first name if the volunteer name has only one word
                                if len(_vn.split()) == 1:
                                    _an = _afn
                                    # If first name has two words, also compare only against first word
                                    _an2 = _afn2
                                else:
                                    _an = (_afn + ' ' + _aln)
                                    # If first name has two words, also compare only against first word
                                    _an2 = (_afn2 + ' ' + _aln2)
                                _aea = _ad.get("i_email_aol", '').strip().lower()
                                _aeo = _ad.get("i_email_other", '').strip().lower()
                                # if isinstance(_cd, datetime) and isinstance(_acd, datetime):
                                #     try:
                                #         logging.info('[load_user_summary] Course dates are: ' + _cd.strftime('%m/%d/%Y') + ' ' + _acd.strftime('%m/%d/%Y'))
                                #     except:
                                #         logging.info('[load_user_summary] Course dates are: Invalid date')
                                if (
                                    # Compare with candidates login email
                                    (_ve.lower() == _c.lower()) or

                                    # Compare email address with AOL and other email addresses
                                    (_aea and _ve.lower() == _aea.lower()) or
                                    (_aeo and _ve.lower() == _aeo.lower()) or

                                    # Compare name with allowed error of 1
                                    (_vn and utils.levenshteinB(_an, _vn, 2, True)) or
                                    # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                    (_ve and '@' not in _ve and _vn and utils.levenshteinB(_an, _vn+' '+_ve, 2, True)) or
                                    # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                    (_ve and '@' not in _ve and utils.levenshteinB(_an, _ve, 1, True)) or

                                    # Compare name with allowed error of 1
                                    (_an2 and _an != _an2 and _vn and utils.levenshteinB(_an2, _vn, 2, True)) or
                                    # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                    (_an2 and _an != _an2 and _ve and '@' not in _ve and _vn and utils.levenshteinB(_an2, _vn+' '+_ve, 2, True)) or
                                    # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                    (_an2 and _an != _an2 and _ve and '@' not in _ve and utils.levenshteinB(_an2, _ve, 1, True))
                                ):
                                    if _t not in _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations']:
                                        _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t] = {}
                                    if _fi not in _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t]:
                                        _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t][_fi] = {}
                                    if _ve not in _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t][_fi]:
                                        _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t][_fi][_ve] = _tn

                                    # If evaluation is submitted increment the count.
                                    if _e.get('is_form_submitted', False):
                                        _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_submitted_count'] += 1
                                        # [START] [reporting_fields] Processing application status
                                        app_status, eval_status = reporting_utils.get_reporting_status(
                                            'post_ttc_self_evaluation_form', 
                                            _a.get('is_form_submitted', False),
                                            _a.get('is_form_complete', False),
                                            _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_submitted_count']
                                        )
                                        _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['reporting_status'] = app_status
                                        _user_data_by_email[_c]['post_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_reporting_status'] = eval_status
                                        # [END] [reporting_fields] Processing application status
                                    # logging.info('[load_user_summary] Matched with candidate: ' + _c)
                                    _user_data_by_email[_t]['post_ttc_feedback_form'][_fi][_ve][Reporting.KEY]['is_reporting_matched'] = 'Y'
                        

            # logging.info('[load_user_summary] Processing post Sahaj TTC evaluations')
            for _fi in _user_data_by_email[_t].get('post_sahaj_ttc_feedback_form', {}):
                if _fi != 'default':
                    # logging.info('[load_user_summary] Processing evaluation instance: ' + _fi)
                    for _ve in _user_data_by_email[_t]['post_sahaj_ttc_feedback_form'][_fi]:
                        # logging.info('[load_user_summary] Processing evaluation for: ' + _ve)
                        _e = _user_data_by_email[_t]['post_sahaj_ttc_feedback_form'][_fi][_ve]
                        # set logged in email
                        _e['email'] = _t
                        _ed = _e.get('data', {})
                        _ed.update(_e.get('form_instance_page_data', {}))
                        _vn = _ed.get('i_ttc_graduate_name', '').strip().lower()
                        _cd = _ed.get('i_course_start', '').strip()
                        _tn = _ed.get('i_fname').strip() + ' ' + _ed.get('i_lname').strip()
                        
                        try:
                            if len(_cd) == 10:
                                _t_cd = datetime.strptime(_cd, '%m/%d/%Y')
                            else:
                                _t_cd = datetime.strptime(_cd, '%m/%d/%y')
                            _cd = _t_cd
                        except Exception as exception:
                            pass
                        # _ve = _ed.get('i_volunteer_email', '').strip()
                        # logging.info('[load_user_summary] Processing evaluation from: ' + _t + ' for ' + _vn + ' [' + _ve + ']')
                        _c_match = ''
                        for _c in _user_data_by_email:
                            for _sefi in _user_data_by_email[_c].get('post_sahaj_ttc_self_evaluation_form', {}):
                                if _sefi == Reporting.KEY:
                                    continue
                                # logging.info('[load_user_summary] Checking match with candidate: ' + _c)
                                _a = _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][_sefi]
                                _ad = _a.get('data', {})
                                _afn = _ad.get('i_fname','').strip().lower()
                                _aln = _ad.get('i_lname','').strip().lower()
                                _afn2 = _afn.split()[0] if _afn else ''
                                _aln2 = _aln.split()[-1] if _aln else ''
                                _acd = _ad.get('i_course_start', '').strip()
                                # Compare only first name if the volunteer name has only one word
                                if len(_vn.split()) == 1:
                                    _an = _afn
                                    # If first name has two words, also compare only against first word
                                    _an2 = _afn2
                                else:
                                    _an = (_afn + ' ' + _aln)
                                    # If first name has two words, also compare only against first word
                                    _an2 = (_afn2 + ' ' + _aln2)
                                _aea = _ad.get("i_email_aol", '').strip().lower()
                                _aeo = _ad.get("i_email_other", '').strip().lower()
                                if (
                                    # Compare with candidates login email
                                    (_ve.lower() == _c.lower()) or

                                    # Compare email address with AOL and other email addresses
                                    (_aea and _ve.lower() == _aea.lower()) or
                                    (_aeo and _ve.lower() == _aeo.lower()) or

                                    # Compare name with allowed error of 1
                                    (_vn and utils.levenshteinB(_an, _vn, 2, True)) or
                                    # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                    (_ve and '@' not in _ve and _vn and utils.levenshteinB(_an, _vn+' '+_ve, 2, True)) or
                                    # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                    (_ve and '@' not in _ve and utils.levenshteinB(_an, _ve, 1, True)) or

                                    # Compare name with allowed error of 1
                                    (_an2 and _an != _an2 and _vn and utils.levenshteinB(_an2, _vn, 2, True)) or
                                    # Compare name with name||email with allowed error of 1. Many put last name instead of email
                                    (_an2 and _an != _an2 and _ve and '@' not in _ve and _vn and utils.levenshteinB(_an2, _vn+' '+_ve, 2, True)) or
                                    # Compare name with just volunteer email with allowed error of 1. Where people have interchanged email and name.
                                    (_an2 and _an != _an2 and _ve and '@' not in _ve and utils.levenshteinB(_an2, _ve, 1, True))
                                ):
                                    if _t not in _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations']:
                                        _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t] = {}
                                    if _fi not in _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t]:
                                        _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t][_fi] = {}
                                    if _ve not in _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t][_fi]:
                                        _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations'][_t][_fi][_ve] = _tn

                                    # If evaluation is submitted increment the count.
                                    if _e.get('is_form_submitted', False):
                                        _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_submitted_count'] += 1
                                        # [START] [reporting_fields] Processing application status
                                        app_status, eval_status = reporting_utils.get_reporting_status(
                                            'post_sahaj_ttc_self_evaluation_form', 
                                            _a.get('is_form_submitted', False),
                                            _a.get('is_form_complete', False),
                                            _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_submitted_count']
                                        )
                                        _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['reporting_status'] = app_status
                                        _user_data_by_email[_c]['post_sahaj_ttc_self_evaluation_form'][Reporting.KEY]['evaluations_reporting_status'] = eval_status
                                        # [END] [reporting_fields] Processing application status
                                    # logging.info('[load_user_summary] Matched with candidate: ' + _c)
                                    _user_data_by_email[_t]['post_sahaj_ttc_feedback_form'][_fi][_ve][Reporting.KEY]['is_reporting_matched'] = 'Y'
                        
        write_retry_params = gcs.RetryParams(backoff_factor=1.1)
        _f = gcs.open(
            constants.USER_SUMMARY_BY_USER,
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
                'user_summary_last_update_datetime': current_datetime,
            }
        )

        # file_path = Utils.create_file(
        #     filename=constants.USER_SUMMARY_FOLDER + constants.USER_SUMMARY_BY_USER_FILENAME,
        #     content=json.dumps(_user_data_by_email, default=utils.json_dumps_set_default),
        #     make_public=False,
        # )

#[END Reporting]

app = webapp2.WSGIApplication(
    [
        ('/reporting/user-summary/load', Reporting),
        ('/reporting/user-summary/get-by-user', Reporting),
        ('/jobs/reporting/user-summary/load', Reporting),
    ],
    debug=True
)

