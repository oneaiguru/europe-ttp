
# from google.cloud import ndb
from google.appengine.ext import ndb
import datetime

class ControlParameters(ndb.Model):
    user_summary_last_update_datetime = ndb.DateTimeProperty('uslupdt')
    user_integrity_last_update_datetime = ndb.DateTimeProperty('uilupdt')
    update_datetime = ndb.DateTimeProperty('updt', auto_now=True)

    @classmethod
    def create(cls, d):
        # client = ndb.Client()
        record = cls.fetch()

        user_summary_last_update_datetime = d.get('user_summary_last_update_datetime', None)
        user_integrity_last_update_datetime = d.get('user_integrity_last_update_datetime', None)
        # if not isinstance(user_summary_last_update_datetime, datetime.date):
        #     try:
        #         user_summary_last_update_datetime = datetime.datetime.strptime(user_summary_last_update_datetime, '%Y-%m-%d %H:%M:%S')
        #     except (TypeError, ValueError):
        #         user_summary_last_update_datetime = None

        # with client.context():  # with client.context() is obligatory to use in the new ndb library
        if not record:
            record = cls(
                user_summary_last_update_datetime = user_summary_last_update_datetime,
                user_integrity_last_update_datetime = user_integrity_last_update_datetime,
            )
        else:
            if user_summary_last_update_datetime:
                record.user_summary_last_update_datetime = user_summary_last_update_datetime
            if user_integrity_last_update_datetime:
                record.user_integrity_last_update_datetime = user_integrity_last_update_datetime
        record.put()
        return record

    @classmethod
    def fetch(cls):
        # client = ndb.Client()
        # with client.context():
        records = cls.query().fetch()
        if records and len(records) > 0:
            return records[0]
        else:
            return None

