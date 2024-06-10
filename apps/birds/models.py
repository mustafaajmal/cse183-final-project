"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *
import os



def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later
db.define_table(
    'species',
    Field('COMMON_NAME', 'string')
)

db.define_table(
    'sightings',
    Field('SAMPLING_EVENT_IDENTIFIER', 'string'),
    Field('COMMON_NAME', 'string'),
    Field('OBSERVATION_COUNT', 'string')
)

db.define_table(
    'checklist',
    Field('SAMPLING_EVENT_IDENTIFIER', 'string'),
    Field('LATITUDE', 'double'),
    Field('LONGITUDE', 'double'),
    Field('OBSERVATION_DATE', 'date'),
    Field('TIME_OBSERVATIONS_STARTED', 'time'),
    Field('OBSERVER_ID', 'string'),
    Field('DURATION_MINUTES', 'double')
)

db.define_table(
    'checklist_table',
        Field('COMMON_NAME', 'string'),
        Field('OBSERVATION_TOTAL', 'integer'),
)

if db(db.species).isempty():
    with open(os.path.join(os.getcwd(), r'apps/birds/uploads/species.csv'), 'r') as dumpfile:
        db.species.import_from_csv_file(dumpfile)
        db.commit()
if db(db.sightings).isempty():
    with open(os.path.join(os.getcwd(), r'apps/birds/uploads/sightings.csv'), 'r') as dumpfile:
        db.sightings.import_from_csv_file(dumpfile)
        db.commit()
if db(db.checklist).isempty():
    with open(os.path.join(os.getcwd(), r'apps/birds/uploads/checklists.csv'), 'r') as dumpfile:
        db.checklist.import_from_csv_file(dumpfile)
        db.commit()

db.commit()
