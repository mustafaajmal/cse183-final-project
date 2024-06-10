from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
import csv

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
def index():
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_user_statistics_url = URL('get_user_statistics')
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
        load_user_statistics_url = URL('load_user_statistics'),
        search_url = URL('search_species', signer=url_signer),
        observation_dates_url = URL('get_observation_dates', signer=url_signer),
        fetch_statistics_url = URL('fetch_statistics', signer=url_signer)
    )

@action('user_statistics')
@action.uses('user_statistics.html', db, auth.user, url_signer)
def user_statistics():
    return dict(
        load_user_statistics_url = URL('load_user_statistics')
    )
    
@action('load_user_statistics')
@action.uses(db, auth.user, url_signer)
def get_user_statistics():
    try:
        query = (db.sightings.OBSERVATION_COUNT > 0)
        common_names = db(query).select(db.sightings.COMMON_NAME, distinct=True).as_list()
        return dict(common_names=common_names)
    except Exception as e:
        logger.error("Error in get_user_statistics: %s", e)
        raise


@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    return dict(my_value=3)

@action('search_species', method=['POST'])
@action.uses(db, auth.user, url_signer)
def search_species():
    query = request.json.get('params', {}).get('q', '')
    species = db(db.sightings.COMMON_NAME.contains(query)).select(db.sightings.COMMON_NAME, distinct=True).as_list()
    return dict(common_names=species)

@action('get_observation_dates', method=['POST'])
@action.uses(db, auth.user, url_signer)
def get_observation_dates():
    common_name = request.json.get('common_name', '')
    dates = db(db.sightings.COMMON_NAME == common_name).select(db.sightings.OBSERVATION_COUNT).as_list()
    observation_dates = [r['OBSERVATION_COUNT'] for r in dates]
    return dict(observation_dates=observation_dates)

@action('fetch_statistics', method=['POST'])
@action.uses(db, auth.user, url_signer)
def fetch_statistics():
    region = request.json.get('region', [])
    # Here you should implement the logic to fetch statistics for the given region
    # For simplicity, this example returns dummy data
    species_data = [
        {"COMMON_NAME": "Sparrow", "checklists": 5, "sightings": 100},
        {"COMMON_NAME": "Robin", "checklists": 3, "sightings": 50},
    ]
    top_contributors = [
        {"name": "Alice", "count": 50},
        {"name": "Bob", "count": 30},
    ]
    return dict(species_data=species_data, top_contributors=top_contributors)

@action('location_information')
@action.uses('location.html', db, auth.user, url_signer)
def location_information():
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        load_user_statistics_url = URL('load_user_statistics'),
        search_url = URL('search_species', signer=url_signer),
        observation_dates_url = URL('get_observation_dates', signer=url_signer),
        fetch_statistics_url = URL('fetch_statistics', signer=url_signer)
    )
