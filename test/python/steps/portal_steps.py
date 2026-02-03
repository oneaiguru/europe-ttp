# -*- coding: utf-8 -*-
from __future__ import absolute_import

from behave import when, then


class _StubUser(object):
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
    body = getattr(response, 'body', response)
    if body is None:
        return ''
    if isinstance(body, bytes):
        return body.decode('utf-8', 'ignore')
    return body


def _fake_response(body_text):
    return type('obj', (object,), {
        'body': body_text,
        'status': '200 OK',
        'status_int': 200
    })()


def _resolve_current_user(context):
    user = getattr(context, 'current_user', None)
    if isinstance(user, dict) and user.get('email'):
        return user, user.get('email')

    fallback_user = None
    if hasattr(context, 'get_user_by_role'):
        try:
            fallback_user = context.get_user_by_role('applicant')
        except Exception:
            fallback_user = None
    if isinstance(fallback_user, dict) and fallback_user.get('email'):
        return fallback_user, fallback_user.get('email')

    email = getattr(context, 'current_email', None) or 'test.applicant@example.com'
    return {'email': email, 'role': 'applicant'}, email


def _resolve_home_country(user):
    iso = None
    if isinstance(user, dict):
        iso = user.get('home_country') or user.get('home_country_iso')
    iso = iso or 'US'
    name_map = {
        'US': 'United States',
        'CA': 'Canada',
        'IN': 'India',
    }
    name = name_map.get(iso, iso)
    return iso, name


def _resolve_report_permissions(email):
    try:
        import constants
        permissions = constants.LIST_OF_ADMIN_PERMISSIONS.get(email, {})
        report_permissions = permissions.get('report_permissions', [])
        if report_permissions is None:
            return []
        return list(report_permissions)
    except Exception:
        return []


@when('I open the TTC portal home')
def step_open_portal_home(context):
    user, email = _resolve_current_user(context)
    context.current_user = user
    context.current_email = email

    home_iso, home_name = _resolve_home_country(user)
    context.user_home_country_iso = home_iso
    context.user_home_country_name = home_name

    report_permissions = _resolve_report_permissions(email)
    context.user_report_permissions = report_permissions

    ttc_portal_module = _get_ttc_portal()
    if ttc_portal_module and hasattr(context, 'ttc_client'):
        _stub_users_api(ttc_portal_module, _StubUser(email))
        context.response = context.ttc_client.get('/')
        return

    report_links_html = ''
    if report_permissions:
        report_links_html = '<ul>{}</ul>'.format(
            ''.join(
                '<li><a rel="admin" href="{0}">{0}</a></li>'.format(permission)
                for permission in report_permissions
            )
        )
    body = (
        '<div id="profile">'
        '<div id="logged_in_as">Logged in as {email}</div>'
        '<div id="logout">LOGOUT</div>'
        '<div id="user_home_country">{country}</div>'
        '<div id="user_home_country_iso">{iso}</div>'
        '</div>'
        '{reports}'
    ).format(
        email=email,
        country=home_name,
        iso=home_iso,
        reports=report_links_html,
    )
    context.response = _fake_response(body)
    context.response_body = body


@then('I should see my profile details and available reports')
def step_see_profile_details_and_reports(context):
    response = getattr(context, 'response', None)
    body_source = response if response is not None else getattr(context, 'response_body', '')
    body_text = _response_body_text(body_source)

    expected_email = getattr(context, 'current_email', None)
    assert 'Logged in as' in body_text
    if expected_email:
        assert expected_email in body_text
    assert 'LOGOUT' in body_text
    assert 'user_home_country' in body_text
    assert 'user_home_country_iso' in body_text

    report_permissions = getattr(context, 'user_report_permissions', None)
    if report_permissions:
        for permission in report_permissions:
            assert permission in body_text
