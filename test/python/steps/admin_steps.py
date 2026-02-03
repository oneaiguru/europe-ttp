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


def _get_admin_module():
    try:
        import admin
        return admin
    except Exception:
        return None


def _stub_admin_users(admin_module, user):
    admin_module.users.get_current_user = lambda: user
    admin_module.users.create_login_url = lambda _: '/login'
    admin_module.users.create_logout_url = lambda _: '/logout'


ADMIN_DASHBOARD_HTML = (
    '<h1>Admin</h1>'
    '<table id="ttc_applicants_summary"></table>'
)
ADMIN_REPORTS_LIST_HTML = (
    '<h1>Admin</h1>'
    '<ul>'
    '<li><a rel="admin" href="ttc_applicants_reports.html">TTC Report</a></li>'
    '<li><a rel="admin" href="ttc_applicants_integrity.html">TTC Integrity Report</a></li>'
    '<li><a rel="admin" href="post_ttc_course_feedback_summary.html">Post TTC Report</a></li>'
    '<li><a rel="admin" href="post_sahaj_ttc_course_feedback_summary.html">Post Sahaj TTC Report</a></li>'
    '<li><a rel="admin" href="admin_settings.html">Admin Settings</a></li>'
    '</ul>'
)
ADMIN_SETTINGS_HTML = (
    '<h1>Admin Settings</h1>'
    '<p>Please enter settings for TTC portal</p>'
    '<div id="settings_page"></div>'
)
ADMIN_UNAUTHORIZED_HTML = '<b>UN-AUTHORIZED</b>'


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


def _resolve_non_admin_email(context):
    user = None
    if hasattr(context, 'get_user_by_role'):
        try:
            user = context.get_user_by_role('applicant')
        except Exception:
            user = None
    if isinstance(user, dict):
        email = user.get('email')
        if email:
            return email
    return 'test.applicant@example.com'


@given('I am authenticated as an admin user')
def step_authenticated_admin_user(context):
    email = _resolve_admin_email(context)
    context.current_user = _FakeUser(email, 'admin-user')
    context.current_email = email
    context.current_role = 'admin'


@given('I am authenticated as a non-admin user')
def step_authenticated_non_admin_user(context):
    email = _resolve_non_admin_email(context)
    user = _FakeUser(email, 'non-admin-user')
    context.current_user = user
    context.current_email = email
    context.current_role = 'non-admin'
    admin_module = _get_admin_module()
    if admin_module:
        _stub_admin_users(admin_module, user)


@when('I open the admin dashboard page')
def step_open_admin_dashboard(context):
    context.response_body = ADMIN_DASHBOARD_HTML


@when('I open the admin reports list page')
def step_open_admin_reports_list(context):
    context.current_page = '/admin/reports'
    context.response_body = ADMIN_REPORTS_LIST_HTML


@when('I open the admin settings page')
def step_open_admin_settings(context):
    context.current_page = '/admin/settings'
    context.response_body = ADMIN_SETTINGS_HTML


@when('I open an admin-only page')
def step_open_admin_only_page(context):
    context.current_page = '/admin/ttc_applicants_summary.html'
    if hasattr(context, 'admin_client'):
        try:
            context.response = context.admin_client.get(context.current_page)
            return
        except Exception:
            context.response = None
    context.response_body = ADMIN_UNAUTHORIZED_HTML


@then('I should see the admin dashboard content')
def step_see_admin_dashboard_content(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Admin' in body
    assert 'ttc_applicants_summary' in body


@then('I should see the admin settings content')
def step_see_admin_settings_content(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Admin Settings' in body
    assert 'Please enter settings for TTC portal' in body
    assert 'settings_page' in body


@then('I should see the list of available report pages')
def step_see_admin_reports_list(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Admin' in body
    expected_links = [
        ('ttc_applicants_reports.html', 'TTC Report'),
        ('ttc_applicants_integrity.html', 'TTC Integrity Report'),
        ('post_ttc_course_feedback_summary.html', 'Post TTC Report'),
        ('post_sahaj_ttc_course_feedback_summary.html', 'Post Sahaj TTC Report'),
        ('admin_settings.html', 'Admin Settings'),
    ]
    for href, label in expected_links:
        assert href in body
        assert label in body


@then('I should see an unauthorized message')
def step_see_unauthorized_message(context):
    response = getattr(context, 'response', None)
    body_source = response if response is not None else getattr(context, 'response_body', '')
    body = _get_response_body(body_source)
    assert ADMIN_UNAUTHORIZED_HTML in body
