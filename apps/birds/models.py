"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


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
    Field('bird_species', 'string'),
)

db.define_table(
    'sightings',
    Field('bird_species', 'string'),
    Field('bird_count', 'integer', default=0),
    Field('user_email', default=get_user_email),
)

db.define_table(
    'checklist',
    Field('latitude', 'integer', default=0),
    Field('longitude', 'integer', default=0),
    Field('modified_on', 'datetime', update=get_time),
    Field('user_email', default=get_user_email),
    Field('duration_minute', 'integer', default=0),
)


db.commit()
