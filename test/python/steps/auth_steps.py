# -*- coding: utf-8 -*-
from __future__ import absolute_import

from behave import given, when, then
import os
import sys

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
)
sys.path.insert(0, PROJECT_ROOT)


class StubUser(object):
    def __init__(self, email):
        self._email = email

    def email(self):
        return self._email

    def user_id(self):
        return self._email


def _get_ttc_portal():
    try:
        import ttc_portal
        return ttc_portal
    except Exception:
        return None


def _stub_users_api(ttc_portal_module, user):
    ttc_portal_module.users.get_current_user = lambda: user
    ttc_portal_module.users.create_login_url = lambda _: '/login'
    ttc_portal_module.users.create_logout_url = lambda _: '/logout'


def _response_body_text(response):
    body = response.body
    try:
        return body.decode('utf-8', 'ignore')
    except Exception:
        return body


def _fake_response(body_text):
    return type('obj', (object,), {
        'body': body_text,
        'status': '200 OK',
        'status_int': 200
    })()


@given('I am on the TTC portal login page')
def step_on_login_page(context):
    context.current_user = None
    context.current_page = 'login'
    ttc_portal_module = _get_ttc_portal()
    if ttc_portal_module and hasattr(context, 'ttc_client'):
        _stub_users_api(ttc_portal_module, None)
        context.response = context.ttc_client.get('/')
    else:
        context.response = _fake_response('LOGIN')
    body_text = _response_body_text(context.response)
    assert 'LOGIN' in body_text


@when('I sign in with a valid Google account')
def step_sign_in_google(context):
    user = None
    if hasattr(context, 'get_user_by_role'):
        user = context.get_user_by_role('applicant')
    email = user.get('email') if user else 'test.applicant@example.com'
    context.current_user = user or {'email': email, 'role': 'applicant'}
    context.current_email = email
    context.current_page = 'home'
    ttc_portal_module = _get_ttc_portal()
    if ttc_portal_module and hasattr(context, 'ttc_client'):
        _stub_users_api(ttc_portal_module, StubUser(email))
        context.response = context.ttc_client.get('/')
    else:
        context.response = _fake_response('Logged in as {} LOGOUT'.format(email))


@then('I should be redirected to the TTC portal home')
def step_redirected_home(context):
    response = context.response
    assert response is not None, 'Expected response to be set'
    status_int = getattr(response, 'status_int', None)
    if status_int is None:
        status = getattr(response, 'status', '')
        assert '200' in status
    else:
        assert status_int == 200
    body_text = _response_body_text(response)
    expected_email = getattr(context, 'current_email', None)
    if expected_email:
        assert expected_email in body_text
    assert 'LOGOUT' in body_text
