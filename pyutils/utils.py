from __future__ import absolute_import

import os
import logging
import hashlib
import numpy as np
import cloudstorage as gcs
# from google.cloud import storage
from google.appengine.api import app_identity

# [START import-sendgrid]
import sendgrid
from sendgrid.helpers import mail
# [END import-sendgrid]

import constants

#[START config-retries]
default_retry_params = gcs.RetryParams(initial_delay=0.2,
                                          max_delay=5.0,
                                          backoff_factor=2,
                                          max_retry_period=15)
gcs.set_default_retry_params(default_retry_params)
#[END config-retries]

DEFAULT_BUCKET_NAME = '/' + os.environ.get('BUCKET_NAME', app_identity.get_default_gcs_bucket_name())

#[START create_file]
def create_file(filename, content=""):
    write_retry_params = gcs.RetryParams(backoff_factor=1.1)
    gcs_file = gcs.open(filename,
                        'w',
                        content_type='text/html',
                        options={'x-goog-acl': 'public-read'},
                        retry_params=write_retry_params)
    gcs_file.write(content)
    gcs_file.close()
#[END create_file]

#[START read_file]
def read_file(filename):
    gcs_file = gcs.open(filename)
    file_contents = gcs_file.read()
    gcs_file.close()
    return file_contents
#[END read_file]


# #[START list_bucket]
# def list_bucket(self, bucket):
#     page_size = 1
#     stats = gcs.listbucket(bucket + '/foo', max_keys=page_size)
#     while True:
#       count = 0
#       for stat in stats:
#         count += 1
#         self.response.write(repr(stat))
#         self.response.write('\n')

#       if count != page_size or count == 0:
#         break
#       stats = gcs.listbucket(bucket + '/foo', max_keys=page_size,
#                              marker=stat.filename)
# #[END list_bucket]

#[START send_email_using_sendgrid]
def send_email_using_sendgrid(to_addr, from_addr, subject, message):
    sg = sendgrid.SendGridAPIClient(apikey=constants.SENDGRID_API_KEY)

    to_email = mail.Email(to_addr)
    from_email = mail.Email(from_addr)
    content = mail.Content('text/html', message)
    message = mail.Mail(from_email, subject, to_email, content)

    # logging.info("API Key: " + constants.SENDGRID_API_KEY)
    # logging.info("to: " + to_addr)
    # logging.info("from: " + from_addr)
    # logging.info("subject: " + subject)
    # logging.info("message: " + message)

    response = sg.client.mail.send.post(request_body=message.get())

    return response
#[END send_email_using_sendgrid]

#[START nl2br]
def nl2br(string, is_xhtml= True ):
    if is_xhtml:
        return string.replace('\n','<br />\n')
    else :
        return string.replace('\n','<br>\n')
#[END nl2br]

#[START get_hash]
def get_hash(string):
    return hashlib.sha256(string).digest()
#[END get_hash]

#[START levenshtein]
def levenshtein(source, target, case_insensitive=False):
    if case_insensitive:
        source = source.lower()
        target = target.lower()
    if len(source) < len(target):
        return levenshtein(target, source, case_insensitive)

    # So now we have len(source) >= len(target).
    if len(target) == 0:
        return len(source)

    # We call tuple() to force strings to be used as sequences
    # ('c', 'a', 't', 's') - numpy uses them as values by default.
    source = np.array(tuple(source))
    target = np.array(tuple(target))

    # We use a dynamic programming algorithm, but with the
    # added optimization that we only need the last two rows
    # of the matrix.
    previous_row = np.arange(target.size + 1)
    for s in source:
        # Insertion (target grows longer than source):
        current_row = previous_row + 1

        # Substitution or matching:
        # Target and source items are aligned, and either
        # are different (cost of 1), or are the same (cost of 0).
        current_row[1:] = np.minimum(
                current_row[1:],
                np.add(previous_row[:-1], target != s))

        # Deletion (target grows shorter than source):
        current_row[1:] = np.minimum(
                current_row[1:],
                current_row[0:-1] + 1)

        previous_row = current_row

    return previous_row[-1]
#[END levenshtein]

#[START levenshteinB]
# Returns a boolean value based on the input distance tolerance
def levenshteinB(source, target, tolerance, case_insensitive=False):
    source = source.strip()
    target = target.strip()
    if not source or not target or len(source) == 0 or len(target) == 0:
        return False

    # If tolerance is greater than length of either string
    # then levenshtein is not that useful
    if tolerance >= len(source) or tolerance >= len(target):
        return False

    if case_insensitive:
        source = source.lower()
        target = target.lower()

    if len(source) < len(target):
        return levenshteinB(target, source, tolerance, case_insensitive)
    # So now we have len(source) >= len(target).

    # We call tuple() to force strings to be used as sequences
    # ('c', 'a', 't', 's') - numpy uses them as values by default.
    source = np.array(tuple(source))
    target = np.array(tuple(target))

    # We use a dynamic programming algorithm, but with the
    # added optimization that we only need the last two rows
    # of the matrix.
    previous_row = np.arange(target.size + 1)
    for s in source:
        # Insertion (target grows longer than source):
        current_row = previous_row + 1

        # Substitution or matching:
        # Target and source items are aligned, and either
        # are different (cost of 1), or are the same (cost of 0).
        current_row[1:] = np.minimum(
                current_row[1:],
                np.add(previous_row[:-1], target != s))

        # Deletion (target grows shorter than source):
        current_row[1:] = np.minimum(
                current_row[1:],
                current_row[0:-1] + 1)

        previous_row = current_row

    if previous_row[-1] <= tolerance:
        return True
    else:
        return False
#[END levenshteinB]

#[START str2bool]
def str2bool(bool_str):
    _bool_val = False
    if bool_str:
        if bool_str.lower() in ["1", "y", "t", "true"]:
            _bool_val = True
    return _bool_val
#[END str2bool]

#[START mask]
def mask(str, n=4, filer="*", filer_cnt=6):
    if str:
        str = "".join((str[0:n], filer * filer_cnt))
    return str
#[END mask]

#[START str_remove_prefix]
def str_remove_prefix(input_str, prefix):
    return input_str[input_str.startswith(prefix) and len(prefix):]
#[START str_remove_prefix]

#[START json_dumps_set_default]
def json_dumps_set_default(obj):
    if isinstance(obj, set):
        return list(obj)
    raise TypeError
#[START json_dumps_set_default]

class Utils:
#     #[START create_file]
#     @staticmethod
#     def create_file(filename, content="", bucket_name=constants.BUCKET_NAME, make_public=False):
#         storage_client = storage.Client()
#         bucket = storage_client.bucket(bucket_name)
#         blob = bucket.blob(filename)
#         blob.upload_from_string(content)
#         if make_public:
#             blob.make_public()
#             return blob.public_url
#         else:
#             return blob.path
#     #[END create_file]

#     #[START read_file]
#     @staticmethod
#     def read_file(filename, bucket_name=constants.BUCKET_NAME):
#         storage_client = storage.Client()
#         bucket = storage_client.bucket(bucket_name)
#         blob = bucket.blob(filename)
#         return blob.download_as_string()
#     #[END read_file]

    #[START list_files]
    @staticmethod
    def list_files(prefix, min_updated_datetime=None):
        files = gcs.listbucket(prefix)

        if not min_updated_datetime:
            return list(files)
        else:
            import time
            min_updated_datetime_posix = time.mktime(min_updated_datetime.timetuple())
            r_files = []
            for f in files:
                if f.st_ctime >= min_updated_datetime_posix:
                    r_files.append(f)
            return r_files
    #[END list_files]


#     #[START read_file]
#     @staticmethod
#     def list_files(prefix, bucket_name=constants.BUCKET_NAME, delimiter='/', min_updated_datetime=None):
#         """Lists all the blobs in the bucket that begin with the prefix.

#         This can be used to list all blobs in a "folder", e.g. "public/".

#         The delimiter argument can be used to restrict the results to only the
#         "files" in the given "folder". Without the delimiter, the entire tree under
#         the prefix is returned. For example, given these blobs:

#             a/1.txt
#             a/b/2.txt

#         If you just specify prefix = 'a', you'll get back:

#             a/1.txt
#             a/b/2.txt

#         However, if you specify prefix='a' and delimiter='/', you'll get back:

#             a/1.txt

#         Additionally, the same request will return blobs.prefixes populated with:

#             a/b/
#         """

#         storage_client = storage.Client()

#         # Note: Client.list_blobs requires at least package version 1.17.0.
#         blobs = storage_client.list_blobs(
#             bucket_name, prefix=prefix, delimiter=delimiter
#         )

#         if not min_updated_datetime:
#             return list(blobs)
#         else:
#             r_blobs = []
#             for blob in blobs:
#                 if blob.updated >= min_updated_datetime:
#                     r_blobs.append(blob)
#             return r_blobs
#     #[END read_file]

