from __future__ import absolute_import

import os
import logging
import hashlib
import numpy as np
import json
import cloudstorage as gcs
from google.appengine.api import app_identity

import constants

# creating enumerations using class 
class ReportingStatus:
    SUBMITTED = 'submitted'
    FILLED = 'filled'
    IN_PROGRESS = 'in progress'
    PENDING = 'pending'
    COMPLETE = 'complete'
    COMPLETE_LIFETIME = 'complete (lifetime)'
    INCOMPLETE = 'incomplete'


#[START get_reporting_status]
def get_reporting_status(form_type, is_form_submitted, is_form_complete, no_of_submitted_evals=0, no_of_lifetime_submitted_evals=0):
    if is_form_submitted:
        _app_status = ReportingStatus.SUBMITTED
    elif is_form_complete:
        _app_status = ReportingStatus.FILLED
    else:
        _app_status = ReportingStatus.IN_PROGRESS

    _eval_status = ReportingStatus.INCOMPLETE
    if form_type == 'ttc_application':
        if no_of_submitted_evals >= 3:
            _eval_status = ReportingStatus.COMPLETE
            if is_form_submitted:
                _app_status = ReportingStatus.COMPLETE
        elif no_of_lifetime_submitted_evals >= 3:
            _eval_status = ReportingStatus.COMPLETE_LIFETIME
            if is_form_submitted:
                _app_status = ReportingStatus.COMPLETE_LIFETIME
    elif form_type == 'post_ttc_self_evaluation_form':
        if no_of_submitted_evals >= 1:
            _eval_status = ReportingStatus.SUBMITTED
            if is_form_submitted:
                _app_status = ReportingStatus.COMPLETE
    elif form_type == 'post_sahaj_ttc_self_evaluation_form':
        if no_of_submitted_evals >= 1:
            _eval_status = ReportingStatus.SUBMITTED
            if is_form_submitted:
                _app_status = ReportingStatus.COMPLETE
    
    return _app_status, _eval_status
#[END get_reporting_status]

#[START get_ttc_list]
def get_ttc_list():
    source_file = constants.FORM_CONFIG_LOCATION + 'ttc_country_and_dates.json'    
    _f = gcs.open(source_file)
    _contents = _f.read()
    _f.close()
    ttc_list_raw = json.loads(_contents)
    ttc_list = {}
    for i, ttc in enumerate(ttc_list_raw):
        ttc_list[ttc["value"]] = ttc
    return ttc_list
#[END get_ttc_list]
