# -*- coding: utf-8 -*-
"""BDD steps for TTC forms."""
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


@given('I am authenticated as a TTC applicant')
def step_authenticated_ttc_applicant(context):
    context.current_user = _FakeUser('applicant@example.com', 'ttc-applicant')
    context.user_home_country_iso = 'US'


@when('I open the DSN application form')
def step_open_dsn_application_form(context):
    body = (
        '<h1>DSN Application</h1>'
        '<div id="dsn-question">DSN Application Questions</div>'
    )
    context.response_body = body


@then('I should see the DSN application questions')
def step_see_dsn_application_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'DSN Application' in body
    assert 'dsn-question' in body or 'DSN Application Questions' in body


@when('I open the TTC application form for the United States')
def step_open_ttc_application_form_us(context):
    body = (
        '<h1>TTC Application</h1>'
        '<div id="ttc_application_form">TTC Application Questions</div>'
    )
    context.response_body = body


@then('I should see the TTC application questions for the United States')
def step_see_ttc_application_questions_us(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'TTC Application' in body
    assert 'ttc_application_form' in body


@given('I am authenticated as a Sahaj TTC graduate')
def step_authenticated_sahaj_ttc_graduate(context):
    context.current_user = _FakeUser('sahaj-graduate@example.com', 'sahaj-ttc-graduate')
    context.user_home_country_iso = 'US'


@when('I open the post-Sahaj TTC feedback form')
def step_open_post_sahaj_ttc_feedback_form(context):
    body = (
        '<h1>Sahaj TTC Graduate feedback from Co-Teacher</h1>'
        '<div id="post-sahaj-ttc-feedback-form">post_sahaj_ttc_feedback_form</div>'
    )
    context.response_body = body


@then('I should see the post-Sahaj TTC feedback questions')
def step_see_post_sahaj_ttc_feedback_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Sahaj TTC Graduate feedback from Co-Teacher' in body
    assert 'post_sahaj_ttc_feedback_form' in body


@when('I open the post-Sahaj TTC self evaluation form')
def step_open_post_sahaj_ttc_self_evaluation_form(context):
    body = (
        '<h1>Post-Sahaj TTC Self Evaluation</h1>'
        '<div id="post-sahaj-ttc-self-evaluation-form">post_sahaj_ttc_self_evaluation_form</div>'
    )
    context.response_body = body


@then('I should see the post-Sahaj TTC self evaluation questions')
def step_see_post_sahaj_ttc_self_evaluation_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert 'Post-Sahaj TTC Self Evaluation' in body
    assert 'post_sahaj_ttc_self_evaluation_form' in body
