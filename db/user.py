from google.appengine.ext import ndb
from common import Utils
import json

class Lead(ndb.Model):
    DATETIME_PROPS = ["updateTime"]
    INTERNAL_PROPS = [] # ["eventEbId" "venueId"]
    SENSITIVE_PROPS = ["email", "phone"]

    user_id = ndb.IntegerProperty('user_id')
    firstName = ndb.StringProperty('fn')
    lastName = ndb.StringProperty('ln')
    email = ndb.StringProperty('email')
    phone = ndb.StringProperty('ph')
    phoneRaw = ndb.StringProperty('phr')
    # Attendee id in eventbrite
    eventbriteId = ndb.IntegerProperty('ebid')
    # CRM id for the lead
    crmId = ndb.StringProperty('crmid')
    updateTime = ndb.DateTimeProperty('updt', auto_now=True)

    # convert to dict format that masks sensitive information
    def dict(self, isAdmin = False):
        d = self.to_dict()
        for p in Lead.SENSITIVE_PROPS:
            d[p] = Utils.mask(d[p])
        # convert time to isoformat to serialize json
        for p in Lead.DATETIME_PROPS:
            if d[p]:
                d[p] = d.pop(p).isoformat()
        for p in Lead.INTERNAL_PROPS:
            if not isAdmin:
                d.pop(p)
        return d

    # prints a human readable string format and masks sensitive information
    def json(self):
        return json.dumps(self.dict(), indent=2, sort_keys=True, default=str)

    def name(self):
        return self.firstName.encode("utf8") + ' ' + self.lastName.encode("utf8")
