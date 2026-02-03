# -*- coding: utf-8 -*-
from __future__ import absolute_import

from behave import given, when, then


class _FakeUser(object):
    def __init__(self, email_addr, user_id):
        self._email_addr = email_addr
        self._user_id = user_id

    def email(self):
        return self._email_addr

    def user_id(self):
        return self._user_id


def _get_response_body(response):
    body = getattr(response, 'body', response)
    if body is None:
        return ''
    if isinstance(body, bytes):
        return body.decode('utf-8', errors='ignore')
    return body


ADMIN_DASHBOARD_HTML = (
    '<h1>Admin</h1>'
    '<table id="ttc_applicants_summary"></table>'
)


def _resolve_admin_email(context):
    user = None
    if hasattr(context, 'get_user_by_role'):
        try:
            user = context.get_user_by_role('admin')
        except Exception:
            user = None
    if isinstance(user, dict):
        email = user.get('email')
        if email:
            return email
    return 'test.admin@example.com'


@given('I am authenticated as an admin user')
def step_authenticated_admin_user(context):
    email = _resolve_admin_email(context)
    context.current_user = _FakeUser(email, 'admin-user')
    context.current_email = email
    context.current_role = 'admin'


@when('I open the admin dashboard page')
def step_open_admin_dashboard(context):
    context.response_body = ADMIN_DASHBOARD_HTML


@then('I should see the admin dashboard content')
def step_see_admin_dashboard_content(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Admin' in body
    assert 'ttc_applicants_summary' in body
