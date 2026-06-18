from __future__ import absolute_import

from datetime import tzinfo, timedelta, datetime, date
from calendar import monthrange
import calendar
import logging

ZERO = timedelta(0)
HOUR = timedelta(hours=1)

WEEKDAY_ABBR2_TO_NUMBER = {
    'MO': 0,
    'TU': 1,
    'WE': 2,
    'TH': 3,
    'FR': 4,
    'SA': 5,
    'SU': 6,
    'mo': 0,
    'tu': 1,
    'we': 2,
    'th': 3,
    'fr': 4,
    'sa': 5,
    'su': 6,
}

# A UTC class.

class UTC(tzinfo):
    """UTC"""

    def utcoffset(self, dt):
        return ZERO

    def tzname(self, dt):
        return "UTC"

    def dst(self, dt):
        return ZERO

utc = UTC()

# A class building tzinfo objects for fixed-offset time zones.
# Note that FixedOffset(0, "UTC") is a different way to build a
# UTC tzinfo object.

class FixedOffset(tzinfo):
    """Fixed offset in minutes east from UTC."""

    def __init__(self, offset, name):
        self.__offset = timedelta(minutes = offset)
        self.__name = name

    def utcoffset(self, dt):
        return self.__offset

    def tzname(self, dt):
        return self.__name

    def dst(self, dt):
        return ZERO

# A class capturing the platform's idea of local time.

import time as _time

STDOFFSET = timedelta(seconds = -_time.timezone)
if _time.daylight:
    DSTOFFSET = timedelta(seconds = -_time.altzone)
else:
    DSTOFFSET = STDOFFSET

DSTDIFF = DSTOFFSET - STDOFFSET

class LocalTimezone(tzinfo):

    def utcoffset(self, dt):
        if self._isdst(dt):
            return DSTOFFSET
        else:
            return STDOFFSET

    def dst(self, dt):
        if self._isdst(dt):
            return DSTDIFF
        else:
            return ZERO

    def tzname(self, dt):
        return _time.tzname[self._isdst(dt)]

    def _isdst(self, dt):
        tt = (dt.year, dt.month, dt.day,
              dt.hour, dt.minute, dt.second,
              dt.weekday(), 0, 0)
        stamp = _time.mktime(tt)
        tt = _time.localtime(stamp)
        return tt.tm_isdst > 0

Local = LocalTimezone()


# A complete implementation of current DST rules for major US time zones.

def first_sunday_on_or_after(dt):
    days_to_go = 6 - dt.weekday()
    if days_to_go:
        dt += timedelta(days_to_go)
    return dt


# US DST Rules
#
# This is a simplified (i.e., wrong for a few cases) set of rules for US
# DST start and end times. For a complete and up-to-date set of DST rules
# and timezone definitions, visit the Olson Database (or try pytz):
# http://www.twinsun.com/tz/tz-link.htm
# http://sourceforge.net/projects/pytz/ (might not be up-to-date)
#
# In the US, since 2007, DST starts at 2am (standard time) on the second
# Sunday in March, which is the first Sunday on or after Mar 8.
DSTSTART_2007 = datetime(1, 3, 8, 2)
# and ends at 2am (DST time; 1am standard time) on the first Sunday of Nov.
DSTEND_2007 = datetime(1, 11, 1, 1)
# From 1987 to 2006, DST used to start at 2am (standard time) on the first
# Sunday in April and to end at 2am (DST time; 1am standard time) on the last
# Sunday of October, which is the first Sunday on or after Oct 25.
DSTSTART_1987_2006 = datetime(1, 4, 1, 2)
DSTEND_1987_2006 = datetime(1, 10, 25, 1)
# From 1967 to 1986, DST used to start at 2am (standard time) on the last
# Sunday in April (the one on or after April 24) and to end at 2am (DST time;
# 1am standard time) on the last Sunday of October, which is the first Sunday
# on or after Oct 25.
DSTSTART_1967_1986 = datetime(1, 4, 24, 2)
DSTEND_1967_1986 = DSTEND_1987_2006

class USTimeZone(tzinfo):

    def __init__(self, hours, reprname, stdname, dstname):
        self.stdoffset = timedelta(hours=hours)
        self.reprname = reprname
        self.stdname = stdname
        self.dstname = dstname

    def __repr__(self):
        return self.reprname

    def tzname(self, dt):
        if self.dst(dt):
            return self.dstname
        else:
            return self.stdname

    def utcoffset(self, dt):
        return self.stdoffset + self.dst(dt)

    def dst(self, dt):
        if dt is None or dt.tzinfo is None:
            # An exception may be sensible here, in one or both cases.
            # It depends on how you want to treat them.  The default
            # fromutc() implementation (called by the default astimezone()
            # implementation) passes a datetime with dt.tzinfo is self.
            return ZERO
        assert dt.tzinfo is self

        # Find start and end times for US DST. For years before 1967, return
        # ZERO for no DST.
        if 2006 < dt.year:
            dststart, dstend = DSTSTART_2007, DSTEND_2007
        elif 1986 < dt.year < 2007:
            dststart, dstend = DSTSTART_1987_2006, DSTEND_1987_2006
        elif 1966 < dt.year < 1987:
            dststart, dstend = DSTSTART_1967_1986, DSTEND_1967_1986
        else:
            return ZERO

        start = first_sunday_on_or_after(dststart.replace(year=dt.year))
        end = first_sunday_on_or_after(dstend.replace(year=dt.year))

        # Can't compare naive to aware objects, so strip the timezone from
        # dt first.
        if start <= dt.replace(tzinfo=None) < end:
            return HOUR
        else:
            return ZERO

Eastern  = USTimeZone(-5, "Eastern",  "EST", "EDT")
Central  = USTimeZone(-6, "Central",  "CST", "CDT")
Mountain = USTimeZone(-7, "Mountain", "MST", "MDT")
Pacific  = USTimeZone(-8, "Pacific",  "PST", "PDT")

#[START utc_to_local]
def utc_to_local(utc_dt):
    # get integer timestamp to avoid precision lost
    timestamp = calendar.timegm(utc_dt.timetuple())
    local_dt = datetime.fromtimestamp(timestamp, Pacific)
    assert utc_dt.resolution >= timedelta(microseconds=1)
    return local_dt.replace(microsecond=utc_dt.microsecond)
#[END utc_to_local]

#[START utc_to_timezone]
def utc_to_timezone(utc_dt, tz=Eastern):
    # get integer timestamp to avoid precision lost
    timestamp = calendar.timegm(utc_dt.timetuple())
    local_dt = datetime.fromtimestamp(timestamp, tz)
    assert utc_dt.resolution >= timedelta(microseconds=1)
    return local_dt.replace(microsecond=utc_dt.microsecond)
#[END utc_to_timezone]

#[START next_dow]
def next_dow(d,day):
    while d.weekday()!=day:
        d+=timedelta(1)
    return d   
#[START next_dow]

# [START] ical_get_next_day
class DayOfMonth(object):
    """docstring for DayOfMonth"""
    def __init__(self, day_of_week, instance):
        super(DayOfMonth, self).__init__()
        self.day_of_week = day_of_week
        self.instance = instance
        self.count = 0

def ical_get_next_day(ical_recur_rule, start_date=datetime.today()):
    logging.info('[ical_get_next_day] Checking for ical_recur_rule')
    _freq = ical_recur_rule.get('FREQ','')
    _interval = int(ical_recur_rule.get('INTERVAL','1'))
    _today = datetime.today()

    _start_date = start_date
    if _freq == 'DAILY':
        _freq_delta = timedelta(days=_interval)
    elif _freq == 'WEEKLY':
        _freq_delta = timedelta(weeks=_interval)
    elif _freq == 'MONTHLY':
        # hacky approach for now since months is not supported
        _freq_delta = timedelta(days=(30*_interval))
    while _start_date <= (_today - _freq_delta):
        _start_date += _freq_delta

    _next_day = None

    if _freq == 'DAILY':
        _next_day = _today + timedelta(days=_interval)
    elif _freq == 'WEEKLY':
        _next_dow_abbr = ical_recur_rule.get('BYDAY','')
        _next_dow = WEEKDAY_ABBR2_TO_NUMBER[_next_dow_abbr]
        _next_day = next_dow(utc_to_local(_today), _next_dow)
    elif _freq == 'MONTHLY':
        _next_dom_abbr_arr = ical_recur_rule.get('BYDAY','').split(',')
        _month_day = ical_recur_rule.get('BYMONTHDAY','')
        _next_dom_arr = []
        _next_days_arr = []
        _curr_dow = _today.weekday()
        _curr_month = _today.month
        _curr_year = _today.year
        if _curr_month == 12:
            _next_month = 1
            _next_year = _curr_year+1
        else:
            _next_month = _curr_month+1
            _next_year = _curr_year
        # Fixed day within month
        # negative month days handled below
        if _month_day and int(_month_day) > 0:
            for _month, _year in [(_curr_month, _curr_year), (_next_month, _next_year)]:
                _d = date(_year, _month, int(_month_day))
                if _d > _today.date():
                    return _d
        # Day of week within month
        for _next_dom_abbr in _next_dom_abbr_arr:
            # get last 2 digits since it may be of the form 1MO or -1MO
            _dow = WEEKDAY_ABBR2_TO_NUMBER[_next_dom_abbr[-2:]]
            _instance = int(_next_dom_abbr[:-2])
            _next_dom_arr.append(DayOfMonth(_dow, _instance))
        # Now loop with current and next months and check against _next_dom_arr
        # this is used to get a list of dates that match and take minimum
        # this is needed since the input BYDAY might be not in asc order
        _r_next_day_arr = []
        for _month, _year in [(_curr_month, _curr_year), (_next_month, _next_year)]:
            _days_in_month = monthrange(_year, _month)[1]
            for _day in xrange(1, 33):
                try:
                    _d = date(_year, _month, _day)
                    # print("Checking day " + _d.strftime('%Y-%m-%d'))
                except ValueError:
                    # for negative month day
                    if _month_day and int(_month_day) < 0:
                        _d = date(_year, _month, (_day - 1) + int(_month_day))
                        if _d > _today.date():
                            return date(_year, _month, (_day - 1) + int(_month_day))
                    break
                _dow = _d.weekday()
                for x in _next_dom_arr:
                    if _dow == x.day_of_week:
                        # increment count for x, and compare with instance
                        x.count = x.count + 1
                        if x.instance > 0:
                            if x.count == x.instance and _d > _today.date():
                                _r_next_day_arr.append(_d)
                        else:
                            if _day + (7 * abs(x.instance)) > _days_in_month and _day + (7 * abs(x.instance)) < _days_in_month+7 and _d > _today.date():
                                # print("found " + _d.strftime('%Y-%m-%d'))
                                _r_next_day_arr.append(_d)
                    # print("%d %d %d" % (x.day_of_week, x.instance, x.count))
            if len(_r_next_day_arr) > 0:
                logging.info('[ical_get_next_day] Found ' + min(_r_next_day_arr).strftime('%Y-%m-%d'))
                return min(_r_next_day_arr)
            for x in _next_dom_arr:
                x.count = 0
    logging.info('[ical_get_next_day] Found ' + _next_day.strftime('%Y-%m-%d'))
    return _next_day
# [END] ical_get_next_day

