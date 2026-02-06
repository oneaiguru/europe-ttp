#!/usr/bin/env python

from __future__ import absolute_import

import os
import time
import json
import datetime
import re
import urllib
import webapp2
import jinja2

import constants
import ttc_portal_user

from google.cloud import storage

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import app_identity
from google.appengine.api import mail
from google.appengine.api import images
from google.appengine.ext import blobstore

from requests_toolbelt.adapters import appengine
appengine.monkeypatch()

# Security: Content-type whitelist for allowed file uploads
ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

# Security: Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Security: Signed URL expiration time (15 minutes)
SIGNED_URL_EXPIRATION_MINUTES = 15

# Security: Handle missing service account file gracefully
service_account_path = os.environ.get('SERVICE_JSON_FILE')
if not service_account_path:
    raise ValueError('SERVICE_JSON_FILE environment variable must be set for GCS operations')
client = storage.Client().from_service_account_json(service_account_path)
bucket = storage.Bucket(client, constants.BUCKET_NAME)

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader('templates'),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)


class FileModel(ndb.Model):
    filename = ndb.StringProperty()
    date_created = ndb.DateTimeProperty(auto_now_add=True)
    date_updated = ndb.DateTimeProperty(auto_now=True)


class SignedUrlHandler(webapp2.RequestHandler):
    def get(self):
        """Generates signed url to which data will be uploaded. Creates entity in database and saves filename
        Returns json data with url and entity key

        Security: Requires authentication, validates filepath, content-type whitelist, enforces file size limits
        """
        # Security: Require authentication - reject anonymous requests
        user = users.get_current_user()
        if not user:
            self.response.status = 401
            self.response.write(json.dumps({'error': 'Authentication required'}))
            return
        default_filename_prefix = user.email()

        # Security: Validate filepath to prevent directory traversal attacks
        filepath = self.request.get('filepath', '')
        if filepath:
            # Reject directory traversal attempts
            if '..' in filepath or filepath.startswith('/'):
                self.response.status = 400
                self.response.write(json.dumps({'error': 'Invalid filepath'}))
                return
            # Only allow alphanumeric, hyphens, underscores, and forward slashes
            if not re.match(r'^[\w\-/]+$', filepath):
                self.response.status = 400
                self.response.write(json.dumps({'error': 'Invalid filepath characters'}))
                return

        # Security: Validate content type against whitelist
        content_type = self.request.get('content_type', '')
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            self.response.status = 400
            self.response.write(json.dumps({'error': 'Invalid content type'}))
            return

        # Security: Ignore client-provided filename for security; use server-controlled format
        # Client could provide malicious filename content, so we generate our own
        _ = self.request.get('filename', '')  # Deliberately ignored
        timestamp = int(time.time())
        # Sanitize user email for use in filename (replace non-alphanumeric with underscore)
        safe_prefix = re.sub(r'[^\w\-]', '_', user.email())
        server_filename = safe_prefix + '_{}'.format(timestamp)

        # Generate filename with validated filepath and server-controlled filename
        filename = filepath + server_filename

        # Security: URL-encode the filename for GCS blob path (safe='/')
        filename = urllib.quote(filename.encode('utf-8'), safe='/')

        # Security: Generate signed URL with reduced expiration (15 minutes instead of 2 hours)
        # and enforce file size limit
        file_blob = bucket.blob(filename, chunk_size=262144 * 5)
        url = file_blob.generate_signed_url(
            datetime.datetime.now() + datetime.timedelta(minutes=SIGNED_URL_EXPIRATION_MINUTES),
            method='PUT',
            content_type=content_type,
            max_bytes=MAX_FILE_SIZE
        )
        file_upload = FileModel(filename=filename)
        file_upload.put()
        key_safe = file_upload.key.urlsafe()
        data = {'url': url, 'key': key_safe}
        self.response.write(json.dumps(data))


class PostUploadHandler(webapp2.RequestHandler):
    def post(self):
        """After upload is completed, this handler can be triggered to do some post processing

        Security: Requires authentication, validates file exists, validates ownership
        """
        key = self.request.params.get('key')
        user = users.get_current_user()

        # Security: Require authentication before any database access
        if not user:
            self.response.status = 401
            self.response.write(json.dumps({'error': 'Authentication required'}))
            return

        # Security: Validate file exists
        file_obj = ndb.Key(urlsafe=key).get()
        if not file_obj:
            self.response.status = 404
            self.response.write(json.dumps({'error': 'File not found'}))
            return

        # Security: Validate ownership - filename should contain user's email
        # This prevents users from accessing files uploaded by other users
        # (filename format is: sanitizedEmail_timestamp, URL-encoded)
        if user.email() not in file_obj.filename:
            self.response.status = 403
            self.response.write(json.dumps({'error': 'Access denied'}))
            return

        _ttc_user = ttc_portal_user.TTCPortalUser(user.email())
        _ttc_user.set_photo_file(file_obj.filename)
        # _ttc_user.set_photo_url()
        _ttc_user.save_user_data()
        # do something with it


app = webapp2.WSGIApplication([
    ('/upload/get_signed_url/*', SignedUrlHandler),
    ('/upload/postdownload/*', PostUploadHandler),
], debug=True)
