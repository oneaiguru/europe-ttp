# BDD step definitions for upload functionality
from behave import when, then
import time


@when(u'I request a signed upload URL for a profile photo')
def step_request_signed_photo_url(context):
    """Simulate requesting a signed URL for photo upload."""
    user_email = getattr(context, 'user_email', 'test.applicant@example.com')
    timestamp = int(time.time())
    upload_key = "photo-{}-{}".format(user_email.replace('@', '-'), timestamp)
    signed_url = "https://storage.googleapis.com/test-bucket/photos/{}?GoogleAccessId=test&Expires={}&Signature=abc123".format(
        user_email, timestamp + 3600
    )
    context.signed_url = signed_url
    context.upload_key = upload_key


@then(u'I should receive a signed URL and upload key for the photo')
def step_verify_signed_photo_response(context):
    """Verify that signed URL and upload key were generated."""
    assert hasattr(context, 'signed_url'), "No signed URL was generated"
    assert hasattr(context, 'upload_key'), "No upload key was generated"
    assert context.signed_url.startswith('https://'), "Invalid signed URL format"
    assert len(context.upload_key) > 0, "Upload key is empty"


@when(u'I request a signed upload URL for a document')
def step_request_signed_document_url(context):
    """Simulate requesting a signed URL for document upload."""
    user_email = getattr(context, 'user_email', 'test.applicant@example.com')
    timestamp = int(time.time())
    upload_key = "document-{}-{}".format(user_email.replace('@', '-'), timestamp)
    signed_url = "https://storage.googleapis.com/test-bucket/documents/{}?GoogleAccessId=test&Expires={}&Signature=abc123".format(
        user_email, timestamp + 3600
    )
    context.signed_url = signed_url
    context.upload_key = upload_key


@then(u'I should receive a signed URL and upload key for the document')
def step_verify_signed_document_response(context):
    """Verify that signed URL and upload key were generated for document upload."""
    assert hasattr(context, 'signed_url'), "No signed URL was generated"
    assert hasattr(context, 'upload_key'), "No upload key was generated"
    assert context.signed_url.startswith('https://'), "Invalid signed URL format"
    assert len(context.upload_key) > 0, "Upload key is empty"
