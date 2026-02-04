
from __future__ import absolute_import

import os
import json
import logging
from datetime import timedelta, datetime

from google.appengine.api import users
from google.appengine.ext import ndb

import webapp2
import cloudstorage as gcs

import constants
from pyutils import utils, Utils
from reporting import reporting_utils
from db import ControlParameters


class ParticipantList(webapp2.RequestHandler):
    KEY = 'reporting'

    def get(self):
        """Handle GET requests for participant list."""
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
            if self.request.path == '/reporting/participant-list/get':
                self.response.write(self.get_participant_list())

    def get_participant_list(self):
        """
        Generate participant list by aggregating enrollment data from user forms.

        Returns JSON array of participant records with:
        - email: User email
        - name: Participant name
        - ttc_option: TTC applied for
        - enrollment_count: Number of people mentioned in enrollment
        - enrollment_list_count: Number of people listed in enrollment list
        - application_status: Status of application
        - last_update: Last update timestamp
        """
        try:
            # Try to load cached participant list
            _f = gcs.open(constants.PARTICIPANT_LIST_FILE)
            _contents = _f.read()
            _f.close()
            return _contents
        except gcs.NotFoundError:
            # If no cached file exists, generate on the fly
            return json.dumps(self._generate_participant_list())

    def _generate_participant_list(self):
        """Generate participant list from user config files."""
        participant_list = []

        # Get list of user config files
        _user_files = Utils.list_files(
            prefix=constants.USER_CONFIG_LOCATION,
        )

        for _f in _user_files:
            if _f.filename.endswith('.json') and not '/summary/' in _f.filename and not '/integrity/' in _f.filename:
                try:
                    gcs_file = gcs.open(_f.filename)
                    _contents = gcs_file.read()

                    if _contents and _contents.strip() != '':
                        _ud = json.loads(_contents)
                        _ue = _ud.get('email', '')
                        gcs_file.close()

                        # Process TTC application forms
                        if 'form_data' in _ud and 'ttc_application' in _ud['form_data']:
                            for _fi_raw in _ud['form_data']['ttc_application']:
                                if _fi_raw == 'default':
                                    continue

                                _fd = _ud['form_data']['ttc_application'][_fi_raw]
                                _data = _fd.get('data', {})
                                _page_data = _fd.get('form_instance_page_data', {})

                                # Extract participant information
                                participant = {
                                    'email': _ue,
                                    'name': _data.get('i_fname', '') + ' ' + _data.get('i_lname', ''),
                                    'ttc_option': _page_data.get('i_ttc_country_and_dates', ''),
                                    'enrollment_count': _data.get('i_enrollment', 0),
                                    'enrollment_list_count': 0,  # Will calculate from list if present
                                    'application_status': self._get_status(_fd),
                                    'last_update': _fd.get('last_update_datetime', ''),
                                }

                                # Calculate enrollment list count if list exists
                                if 'i_enrollment_list' in _data and isinstance(_data['i_enrollment_list'], list):
                                    participant['enrollment_list_count'] = len(_data['i_enrollment_list'])

                                participant_list.append(participant)

                except Exception as e:
                    logging.error('[participant_list] Error processing file {}: {}'.format(_f.filename, str(e)))
                    continue

        return participant_list

    def _get_status(self, form_data):
        """Get human-readable status from form data."""
        if form_data.get('is_form_submitted', False):
            return 'submitted'
        elif form_data.get('is_form_complete', False):
            return 'complete'
        else:
            return 'draft'


app = webapp2.WSGIApplication(
    [
        ('/reporting/participant-list/get', ParticipantList),
    ],
    debug=True
)
