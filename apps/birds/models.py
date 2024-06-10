"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *
import os
import csv



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
    Field('user_email', default=get_user_email),
    Field('date', 'datetime', default=get_time),
    Field('species_name', 'string'),
    Field('numSeen', 'integer')
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

def load_sightings():
    if db(db.sightings).isempty():
        with open('./csvfiles/sightings.csv', 'r') as f:
            reader = csv.reader(f)
            next(reader)  # Skip the header row
            for row in reader:
                try: 
                    OBSERVATION_COUNT = int(row[2])
                except ValueError:
                    OBSERVATION_COUNT = 0
                db.sightings.insert(
                    SAMPLING_EVENT_IDENTIFIER=row[0],
                    COMMON_NAME=row[1],
                    OBSERVATION_COUNT=OBSERVATION_COUNT,
                    user_email=None
                )

load_sightings()

db.commit()
