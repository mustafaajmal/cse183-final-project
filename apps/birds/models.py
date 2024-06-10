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

# Define the species table
db.define_table(
    'species',
    Field('COMMON_NAME', 'string', requires=IS_NOT_EMPTY())
)

# Define the sightings table
db.define_table(
    'sightings',
    Field('SAMPLING_EVENT_IDENTIFIER', 'string', requires=IS_NOT_EMPTY()),
    Field('COMMON_NAME', 'string', requires=IS_NOT_EMPTY()),
    Field('OBSERVATION_COUNT', 'integer', requires=IS_INT_IN_RANGE(0, None))
)

# Define the checklist table
db.define_table(
    'checklist',
    Field('SAMPLING_EVENT_IDENTIFIER', 'string', requires=IS_NOT_EMPTY()),
    Field('LATITUDE', 'double', requires=IS_FLOAT_IN_RANGE(-90, 90)),
    Field('LONGITUDE', 'double', requires=IS_FLOAT_IN_RANGE(-180, 180)),
    Field('OBSERVATION_DATE', 'date', requires=IS_DATE()),
    Field('TIME_OBSERVATIONS_STARTED', 'time', requires=IS_TIME()),
    Field('OBSERVER_ID', 'string', requires=IS_NOT_EMPTY()),
    Field('DURATION_MINUTES', 'integer', requires=IS_INT_IN_RANGE(0, None))
)

# Populate the tables from CSV files if they are empty
if db(db.species).isempty():
    with open(os.path.join(os.getcwd(), 'apps/birds/uploads/species.csv'), 'r') as dumpfile:
        db.species.import_from_csv_file(dumpfile)
        db.commit()

if db(db.sightings).isempty():
    with open(os.path.join(os.getcwd(), 'apps/birds/uploads/sightings.csv'), 'r') as dumpfile:
        db.sightings.import_from_csv_file(dumpfile)
        db.commit()

if db(db.checklist).isempty():
    with open(os.path.join(os.getcwd(), 'apps/birds/uploads/checklists.csv'), 'r') as dumpfile:
        db.checklist.import_from_csv_file(dumpfile)
        db.commit()

db.commit()
