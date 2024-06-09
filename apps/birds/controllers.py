"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from py4web.utils.grid import Grid, GridClassStyleBulma
from .models import get_user_email
import csv

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        get_user_statistics_url = URL('get_user_statistics'),
        search_url = URL('search'),
    )

@action('checklist')
@action.uses('checklist.html', db, auth.user, url_signer)
def checklist():
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('location')
@action.uses('location.html', db, auth.user, url_signer)
def location():
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
    )

@action('user_statistics')
@action.uses('user_statistics.html', db, auth.user, url_signer)
def user_statistics():
    return dict(
        load_user_statistics_url = URL('load_user_statistics'),
        search_url = URL('search'),
        observation_dates_url = URL('observation_dates')
    )
    
@action('load_user_statistics')
@action.uses(db, auth.user, url_signer)
def get_user_statistics():
    query = (db.sightings.OBSERVATION_COUNT.regexp('^[0-9]+$')) & (db.sightings.OBSERVATION_COUNT.cast('integer') > 0)
    common_names = db(query).select(db.sightings.COMMON_NAME, distinct=True).as_list()
    print("user statistics contains all birds")
    return dict(common_names=common_names)

@action('search', method=["POST"])
@action('search')
@action.uses(db, auth.user, url_signer)
def search():
    data = request.json
    q = data.get("params", {}).get("q")
    option = data.get("params", {}).get("option")
    print("query", q)
    print("option", option)
    query = (db.sightings.OBSERVATION_COUNT.regexp('^[0-9]+$')) & (db.sightings.OBSERVATION_COUNT.cast('integer') > 0)
    if q:
        query &= (db.sightings.COMMON_NAME.contains(q))
    if option == "recent":
        query &= (db.sightings.SAMPLING_EVENT_IDENTIFIER == db.checklist.SAMPLING_EVENT_IDENTIFIER)
        common_names = db(query).select(db.sightings.COMMON_NAME, orderby=~db.checklist.OBSERVATION_DATE, distinct=True).as_list()
    elif option == "old":
        query &= (db.sightings.SAMPLING_EVENT_IDENTIFIER == db.checklist.SAMPLING_EVENT_IDENTIFIER)
        common_names = db(query).select(db.sightings.COMMON_NAME, orderby=db.checklist.OBSERVATION_DATE, distinct=True).as_list()
    else:
        common_names = db(query).select(db.sightings.COMMON_NAME, distinct=True).as_list()
    print("searched by query", q)
    return dict(common_names=common_names)

@action('observation_dates', method=["POST"])
@action('observation_dates')
@action.uses(db, auth.user, url_signer)
def observation_date():
    data = request.json
    common_name = data.get("common_name")
    observation_date = data.get("observation_date")
    if not common_name:
        return dict(observation_dates=[], most_recent_sighting=None)
    
    query = (db.sightings.COMMON_NAME == common_name) & \
            (db.sightings.SAMPLING_EVENT_IDENTIFIER == db.checklist.SAMPLING_EVENT_IDENTIFIER)
    
    if observation_date:
        query &= (db.checklist.OBSERVATION_DATE == observation_date)
        most_recent_sighting = db(query).select(
            db.checklist.LATITUDE, 
            db.checklist.LONGITUDE, 
            orderby=~db.checklist.OBSERVATION_DATE, 
            limitby=(0, 1)
        ).first()
    else:
        most_recent_sighting = db(query).select(
            db.checklist.LATITUDE, 
            db.checklist.LONGITUDE, 
            orderby=~db.checklist.OBSERVATION_DATE, 
            limitby=(0, 1)
        ).first()

    if most_recent_sighting:
        most_recent_sighting = dict(
            LATITUDE=most_recent_sighting.LATITUDE,
            LONGITUDE=most_recent_sighting.LONGITUDE
        )

    observation_dates = db(query).select(db.checklist.OBSERVATION_DATE, distinct=True).as_list()

    return dict(observation_dates=observation_dates, most_recent_sighting=most_recent_sighting)

@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    # The return value should be a dictionary that will be sent as JSON.

    '''
    if db(db.species).isempty():
        with open('species.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                species = db.species.insert(name=row[0])
    if db(db.sightings).isempty():
        with open('sightings.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                sightings = db.sightings.insert(name=row[0],
                                                bird_count=row[1])
    if db(db.checklist).isempty():
        with open('checklist.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                checklist = db.sightings.insert(name=row[0])

    return dict(my_value=3, species = species, sightings = sightings, checklist = checklist)

    '''

