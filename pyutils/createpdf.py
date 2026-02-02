#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import absolute_import

import os
import time
import json
import datetime
import webapp2
import jinja2
import constants
import io
#import sys
#reload(sys)
#sys.setdefaultencoding('utf-8')

# from google.cloud import storage

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import app_identity
from google.appengine.api import mail
from google.appengine.api import images
from google.appengine.ext import blobstore

import StringIO
import xhtml2pdf.pisa as pisa
from PyPDF2 import PdfFileWriter, PdfFileReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics,ttfonts

import cloudstorage as gcs

import constants

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class CreatePDF(webapp2.RequestHandler):
    def get(self):
        f = gcs.open(constants.TEMP_FILES_LOCATION + 'test.html')
        sourceHtml = unicode(f.read(), errors='ignore')
        f.close()
        packet = StringIO.StringIO() #write to memory
        pisa.CreatePDF(sourceHtml,dest=packet)
        packet.seek(0)
        reader = PdfFileReader(packet) #generated pdf
        output = PdfFileWriter() #writer for the merged pdf
        for i in range(reader.getNumPages()):
            output.addPage(reader.getPage(i))
        outputStream = StringIO.StringIO()
        output.write(outputStream) #write merged output to the StringIO object
        self.response.headers['Content-Type'] = 'application/pdf'
        self.response.headers['Content-Disposition'] = 'attachment; filename=test.pdf'
        self.response.write(outputStream.getvalue())


app = webapp2.WSGIApplication([
    ('/createpdf/*', CreatePDF)
], debug=True)
