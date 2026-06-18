from __future__ import absolute_import

import os
import urllib
import re
import json
import unicodedata
import logging
import base64
import hashlib
from datetime import datetime

import sys
import traceback

import constants
from pyutils as utils

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import urlfetch
from google.appengine.api import app_identity
from google.appengine.api import mail
from webapp2_extras import sessions

import jinja2
import webapp2
import cloudstorage as gcs

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)


# current_user = users.get_current_user()
# if current_user:
#     logout_url = users.create_logout_url(self.request.uri)
# else:
#     login_url = users.create_login_url(self.request.uri)

#[START UploadForm]
class UploadForm(webapp2.RequestHandler):
    def post(self):
    form_data = self.session['form_data']
    # if (!isset($_SESSION['userObj'])) {
    #   require_once(dirname(__FILE__).'/get_user_config.php');
    # }
    if (form_data is None) :
        # $user = UserService::getCurrentUser();
        # if ($user) 
        # {
        #   $username = $user->getNickname();
        #   //setcookie("username", $username, time()+3600, "/");
        #   $_SESSION['currentuser'] = $username;
        user = users.get_current_user()
        if user:
            username = user.nickname()
            self.session['username'] = username
            file_contents = ???????

            #   $fileContents = @file_get_contents(CLOUD_STORAGE_LOCATION . '/config/user_config/' . $username . '.cfg');

            #   if (!$fileContents OR $fileContents == "") 
            #   {
            #     $userObj = new TTCPortalUser("");
            #     $userObj->username = $username;
            #     $userObj->user = $user;
            #     $userObj->email = $user->getEmail();
            #   }
            #   else
            #   {
            #     $tUserObj = json_decode($fileContents);
            #     $userObj = new TTCPortalUser($tUserObj);
            #     $userObj->username = $username;
            #     $userObj->user = $user;
            #     $userObj->email = $user->getEmail();
            #   }
            #   $_SESSION['userObj'] = $userObj;
            # }

            if (file_contents is None or file_contents =="") :
                user_obj = TTCPortalUser ("")
            else :
                t_user_obj = ????? json decode
                user_obj = TTCPortalUser(t_user_obj)
            user_obj.username = username
            user_obj.user = user
            userObj.email =????
            self.session['user_obj'] = user_obj

            # else 
            # {
            #   // header('Location: ' . UserService::createLoginURL($_SERVER['REQUEST_URI']));
            #   header('Location: ' . UserService::createLoginURL('/'));
            # }
        else :
            ???? LOGIN URL
    else :
        # if(isset($_POST["pageNumber"])) {
        #   $pageNumber = $_POST["pageNumber"];
        # } else {
        #   $pageNumber = "";
        # }
        # if(isset($_POST["formType"])) {
        #   $formType = $_POST["formType"];
        # } else {
        #   $formType = "";
        # }
        # $objPageJson = $_POST["objPage"];
        page_number = self.request.get('page_number') if self.request.get('page_number') != None else ""
        form_type = self.request.get('form_type') if self.request.get('form_type') != None else ""
        obj_page_json = self.request.get('obj_page')
        # $objPage = json_decode($objPageJson);
        obj_page = ????? Decode
            // Assign values based on 
        # if (empty($formType)) 
        # {
        #   if ($pageNumber == "1") 
        #   {
        #     $_SESSION['userObj']->name = $objPage->i_fname . " " . $objPage->i_lname;
        #   }
        #   $formId = "";
        #   $_SESSION['userObj']->setAppFormData($objPage);
        # }
        if form_type == "" :
            if page_number == "1" :
        elif (form_type == "evaluation")


    elseif ($formType == "evaluation")
    {
      if ($pageNumber == "1") 
      {
        // Saving previous email
        // $prevEvaluationId = $_SESSION['userObj']->currentEvaluationId;
        $_SESSION['userObj']->currentEvaluationId = trim($objPage->i_volunteer_email);
      }
      if (empty($_SESSION['userObj']->currentEvaluationId)) {
        throw new SessionTimedOutException('Unknown candidate');
      }

      $formId = $_SESSION['userObj']->currentEvaluationId . '.' . $formType;

      // If emails differ, rename files
      // if (!empty($prevEvaluationId) AND $prevEvaluationId != $_SESSION['userObj']->currentEvaluationId) 
      // {
      //   $oldFormId = $prevEvaluationId . '.' . $formType;
      //   for ($pNo=1; $pNo <= NO_OF_EVALUATION_PAGES; $pNo++) 
      //   { 
      //     $oldFileName = CLOUD_STORAGE_LOCATION . '/form_storage/' . $_SESSION['userObj']->username . '.' . $oldFormId . 'page'.$pNo.'.txt';
      //     $newFileName = CLOUD_STORAGE_LOCATION . '/form_storage/' . $_SESSION['userObj']->username . '.' . $formId . 'page'.$pNo.'.txt';
      //     copy($oldFileName, $oldFileName . '_bkp');
      //     rename($oldFileName, $newFileName);
      //   }
      //   // Unset evalFormData for id
      //   $_SESSION['userObj']->switchEvalFormDataId($prevEvaluationId, $_SESSION['userObj']->currentEvaluationId);
      // }

      $_SESSION['userObj']->setEvalFormData($objPage);
    }
    elseif ($formType == "evaluator_profile") 
    {
      $_SESSION['userObj']->name = $objPage->i_name;
      if($_POST["profileComplete"] == true)
        $_SESSION['userObj']->setProfileComplete();
      else
        $_SESSION['userObj']->setProfileIncomplete();
      $formId = $formType;
    }
    elseif ($formType == "selfevaluation") {
      if ($pageNumber == "1") 
      {
        $_SESSION['userObj']->name = $objPage->i_fname . " " . $objPage->i_lname;
        $_SESSION['userObj']->currentSelfEvaluationId = trim($objPage->i_course_start_date);
      }
      $formId = $_SESSION['userObj']->currentSelfEvaluationId . '.' . $formType;
    }

    $fp = fopen(CLOUD_STORAGE_LOCATION . '/form_storage/' . $_SESSION['userObj']->username . '.' . $formId . 'page'.$pageNumber.'.txt', 'w');
    fwrite($fp, $objPageJson);
    fclose($fp);

    require_once(dirname(__FILE__).'/save_user_config.php');













        domain_name = '.appspot.com'
        bucket_name = app_identity.app_identity.get_application_id() + domain_name
        self.response.headers['Content-Type'] = 'text/plain'
      # self.response.write('Demo GCS Application running from Version: '
      #                 + os.environ['CURRENT_VERSION_ID'] + '\n')
        # self.response.write('Using bucket name: ' + bucket_name + '\n\n' + app_identity.get_application_id())
        file_name = 'RajeshAgarwal.test.txt'
        write_retry_params = gcs.RetryParams(backoff_factor=1.1)

        formEntries = self.request.get('form_entries')
        gcs_file = gcs.open('/' + domain_name + '/' + file_name,
                      'w',
                      content_type='text/plain',
                      options={'x-goog-meta-foo': 'foo',
                               'x-goog-meta-bar': 'bar'},
                      retry_params=write_retry_params)
        gcs_file.write(formEntries)
        gcs_file.close()
        self.response.write(formEntries)
#[END UploadForm]

class TTCPortalUser:
    user = None
    username = None
    email = None
    agreement_accepted = None
    name = None
    current_app_page = None
    current_eval_page = None
    photo_file = None
    photo_url = None
    application_submitted = None
    evaluation_submitted = None
    current_evaluation_id = None
    current_self_evaluation_id = None
    is_profile_complete = False
    last_update_timestamp = None

    app_form_data =  {}
    eval_form_data = {}
    evaluator_profile_data = {}

    def set_email():
        self.email = username_to_email(self.username)        

    def set_last_update_timestamp(ts):
        self.last_update_timestamp = ts
  
    def set_is_profile_complete(prof):
        self.is_profile_complete = prof
  
    def set_evaluator_profile_data(obj):
        self.evaluator_profile_data.update(obj)
  
    def set_app_form_data(obj):
        self.app_form_data.update(obj)
  
    def set_eval_form_data(obj):
        self.eval_form_data.update(obj)
  
    def unset_eval_form_data(eval_id):
        del self.eval_form_data[eval_id]

    def switch_eval_form_data_id(old_eval_id, new_eval_id):
        if old_eval_id in self.eval_form_data:
            self.eval_form_data[new_eval_id] = self.eval_form_data[old_eval_id]
            del self.eval_form_data[old_eval_id]

    def set_evaluation_submitted():
        if self.current_evaluation_id in self.eval_form_data:
            self.eval_form_data[self.current_evaluation_id]['evaluation_submitted'] = True

    def set_send_confirmation_to_candidate(send_confirm) :
        if self.current_evaluation_id in self.eval_form_data:
            self.eval_form_data[self.current_evaluation_id]['send_confirmation_to_candidate'] = send_confirm

    def get_app_form_data(key) :
        _return_val = ""
        if key == '*' :
            _return_val = app_form_data
        else :
            _return_val = app_form_data.get(key, "")
        return _return_val

    def set_defaults():
        self.username = ''
        self.email = ''
        self.agreement_accepted = ''
        self.name = ''
        self.current_app_page = ''
        self.current_eval_page = ''
        self.photo_file = ''
        self.application_submitted = ''
        self.evaluation_submitted = ''
        # RAJESH : WHERE IS THIS BEING SET
        self.photo_url = DEFAULT_PHOTO_URL

    def __init__(user_obj):
        if user_obj is None :
            self.set_defaults
        else :
            self.user = user_obj.get('user', '')
            self.username = user_obj.get('username', '')
            self.email = user_obj.get('email', '')
            self.agreement_accepted = user_obj.get('', '')
            self.name = user_obj.get('name', '')
            self.current_app_page = user_obj.get('current_app_page', '')
            self.current_eval_page = user_obj.get('current_app_page', '')
            self.photo_file = user_obj.get('photo_file ', '')
            self.photo_url = user_obj.get('photo_url', '')
            self.application_submitted = user_obj.get('application_submitted', '')
            self.evaluation_submitted = user_obj.get('evaluation_submitted', '')
            self.current_evaluation_id = user_obj.get('current_evaluation_id', '')
            self.current_self_evaluation_id = user_obj.get('current_self_evaluation_id', '')
            self.app_form_data =  user_obj.get('app_form_data', '')
            self.evaluator_profile_data = user_obj.get('evaluator_profile_data', '')
            self.eval_form_data = user_obj.get('eval_form_data', '')
            self.is_profile_complete = user_obj.get('is_profile_complete', '')
            self.last_update_timestamp = user_obj.get('last_update_timestamp', '')


def username_to_email(google_username):
    email = "";
    if google_username and google_username.strip() != '':
        if '@' in google_username:
            email = google_username;
        else:
            email = google_username . "@gmail.com";
    return email;

app = webapp2.WSGIApplication(
    [
        ('/api/upload-form', UploadForm),
    ],
    debug=True
)

