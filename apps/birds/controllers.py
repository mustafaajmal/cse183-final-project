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

session, db, T, auth, and templates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

import json
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
        get_bird_sightings_url = URL('get_bird_sightings'),
        save_coords_url = URL('save_coords'),
    )

@action('get_region_data', method=['POST'])
@action.uses(db, auth.user)
def get_region_data():
    region_id = request.json.get('regionId')
    # Dummy data
    species_data = [
        {'id': 1, 'name': 'Blue Jay', 'checklists': 5, 'sightings': 15},
        {'id': 2, 'name': 'Carolina Wren', 'checklists': 8, 'sightings': 25},
        {'id': 3, 'name': 'House Sparrow', 'checklists': 6, 'sightings': 18},
        {'id': 4, 'name': 'Red-winged Blackbird', 'checklists': 7, 'sightings': 20}
    ]
    top_contributors = [
        {'name': 'John Doe', 'email': 'john@example.com'},
        {'name': 'Jane Smith', 'email': 'jane@example.com'},
        {'name': 'Richard Roe', 'email': 'richard@example.com'}
    ]
    return dict(speciesData=species_data, topContributors=top_contributors, totalChecklists=26, totalSightings=78)

@action('get_species_data', method=['POST'])
@action.uses(db, auth.user)
def get_species_data():
    species_id = request.json.get('speciesId')
    # Dummy data
    if species_id == 1:
        graph_data = [
            {'date': '2024-06-01', 'count': 5},
            {'date': '2024-06-02', 'count': 10},
            {'date': '2024-06-03', 'count': 7}
        ]
    elif species_id == 2:
        graph_data = [
            {'date': '2024-06-01', 'count': 8},
            {'date': '2024-06-02', 'count': 12},
            {'date': '2024-06-03', 'count': 5}
        ]
    elif species_id == 3:
        graph_data = [
            {'date': '2024-06-01', 'count': 6},
            {'date': '2024-06-02', 'count': 8},
            {'date': '2024-06-03', 'count': 4}
        ]
    elif species_id == 4:
        graph_data = [
            {'date': '2024-06-01', 'count': 10},
            {'date': '2024-06-02', 'count': 5},
            {'date': '2024-06-03', 'count': 7}
        ]
    return dict(graphData=graph_data)

@action('get_bird_sightings', method=['POST'])
@action.uses(db, auth.user, url_signer)
def get_bird_sightings():
    north = request.json.get('north')
    south = request.json.get('south')
    east = request.json.get('east')
    west = request.json.get('west')

    events_in_bounds = db(
        (db.checklist.LATITUDE <= north) & 
        (db.checklist.LATITUDE >= south) &
        (db.checklist.LONGITUDE <= east) &
        (db.checklist.LONGITUDE >= west)
    ).select(db.checklist.SAMPLING_EVENT_IDENTIFIER)

    event_ids = [event.SAMPLING_EVENT_IDENTIFIER for event in events_in_bounds]
    sightings = db(db.sightings.SAMPLING_EVENT_IDENTIFIER.belongs(event_ids)).select()

    sightings_list = []
    for sighting in sightings:
        event_location = db(db.checklist.SAMPLING_EVENT_IDENTIFIER == sighting.SAMPLING_EVENT_IDENTIFIER).select().first()
        if event_location:
            try:
                intensity = int(sighting.OBSERVATION_COUNT)
            except ValueError:
                intensity = 0
            sightings_list.append({
                'species': sighting.COMMON_NAME,
                'lat': event_location.LATITUDE,
                'lon': event_location.LONGITUDE,
                'obs_id': event_location.OBSERVER_ID,
                'date': event_location.OBSERVATION_DATE,
                'intensity': intensity
            })
    print("Makes it here", len(sightings_list))
    return dict(sightings=sightings_list)

@action('save_coords', method='POST')
@action.uses(db, auth.user, url_signer, session)
def save_coords():
    data = request.json
    session['drawn_coordinates'] = data.get('drawing_coords')
    return 'Coordinates saved successfully.'

@action('checklist')
@action.uses('checklist.html', db, auth.user, url_signer)
def checklist():
    if not auth.current_user:
        redirect(URL('auth/login'))
    return dict(
        checklist_data_url=URL('checklist_data'),
        my_checklist_url=URL('my_checklist'),
        update_sightings_url=URL('update_sightings')
    )

@action('checklist_data', method="GET")
@action.uses(db, auth)
def checklist_data():
    species_sightings = db(db.sightings).select(
        db.sightings.COMMON_NAME.with_alias('common_name'),
        db.sightings.OBSERVATION_COUNT.sum().with_alias('total_sightings'),
        groupby=db.sightings.COMMON_NAME
    ).as_list()
    return dict(checklist_data=species_sightings)

@action('update_sightings', method=["POST"])
@action.uses(db, auth, url_signer)
def update_sightings():
    common_name = request.json.get('common_name')
    new_sightings = request.json.get('new_sightings')

    if common_name is None or new_sightings is None:
        abort(400, "Invalid request")

    sightings = db(db.sightings.COMMON_NAME == common_name).select().first()

    if sightings:
        sightings.update_record(OBSERVATION_COUNT=str(int(sightings.OBSERVATION_COUNT) + new_sightings))
        total_sightings = sightings.OBSERVATION_COUNT
    else:
        total_sightings = new_sightings
        db.sightings.insert(COMMON_NAME=common_name, OBSERVATION_COUNT=total_sightings)

    return dict(total_sightings=total_sightings)

@action('my_checklists')
@action.uses('my_checklists.html', db, auth.user, session)
def my_checklists():
    drawn_coordinates = session.get('drawn_coordinates', [])
    return dict(
        load_checklists_url=URL('load_checklists'),
        delete_checklist_url=URL('delete_checklist'),
        edit_checklist_url=URL('edit_checklist'),
        drawn_coordinates = json.dumps(drawn_coordinates),
    )

@action('load_checklists')
@action.uses(db, auth.user)
def load_checklists():
    user_email = get_user_email()
    # Query the 'checklist' table based on the current user's email
    checklists = db(db.checklist.OBSERVER_ID == user_email).select().as_list()
    return dict(checklists=checklists)

@action('add_checklist')
@action.uses('add_checklist.html', db, auth.user, url_signer)
def add_checklist():
    if not auth.current_user:
        redirect(URL('auth/login'))
    return dict(
        submit_checklist_url=URL('submit_checklist')
    )

@action('submit_checklist', method='POST')
@action.uses(db, auth.user, url_signer)
def submit_checklist():
    if not auth.current_user:
        redirect(URL('auth/login'))

    # Extract data from the request
    species_name = request.forms.get('species_name')
    latitude = float(request.forms.get('latitude'))
    longitude = float(request.forms.get('longitude'))
    observation_date = request.forms.get('observation_date')
    time_observations_started = request.forms.get('time_observations_started')
    duration_minutes = float(request.forms.get('duration_minutes'))

    # Get the current user's email for OBSERVER_ID
    observer_id = get_user_email()

    # Query the sightings table to find the SAMPLING_EVENT_IDENTIFIER
    sighting = db(db.sightings.COMMON_NAME == species_name).select().first()
    if not sighting:
        return dict(message="Sighting for the given species not found")

    sampling_event_identifier = sighting.SAMPLING_EVENT_IDENTIFIER

    # Insert data into the checklist table
    db.checklist.insert(
        SAMPLING_EVENT_IDENTIFIER=sampling_event_identifier,
        LATITUDE=latitude,
        LONGITUDE=longitude,
        OBSERVATION_DATE=observation_date,
        TIME_OBSERVATIONS_STARTED=time_observations_started,
        OBSERVER_ID=observer_id,
        DURATION_MINUTES=duration_minutes
    )

    # Redirect to the my_checklist page
    redirect(URL('my_checklists'))

@action('delete_checklist/<checklist_id:int>', method='DELETE')
@action.uses(db, auth.user)
def delete_checklist(checklist_id=None):
    if checklist_id:
        db(db.checklist_table.id == checklist_id).delete()
        return dict(message="Checklist deleted")
    return dict(message="Checklist not deleted")

@action('edit_checklist', method='POST')
@action.uses(db, auth.user)
def edit_checklist():
    checklist_id = request.json.get('id')
    data = request.json.get('data')
    if checklist_id:
        db(db.checklist_table.id == checklist_id).update(data=data)
        return dict(message="Checklist updated")
    return dict(message="Checklist not updated")

@action('location')
@action.uses('location.html', db, auth.user, url_signer, session)
def location():
    drawn_coordinates = session.get('drawn_coordinates', [])
    return dict(
        my_callback_url = URL('my_callback', signer=url_signer),
        get_bird_sightings_url = URL('get_bird_sightings'),
        drawn_coordinates = json.dumps(drawn_coordinates),
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
    return dict(common_names=common_names)

@action('search', method=["POST"])
@action.uses(db, auth.user, url_signer)
def search():
    data = request.json
    q = data.get("params", {}).get("q")
    option = data.get("params", {}).get("option")
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
    return dict(common_names=common_names)

@action('observation_dates', method=["POST"])
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
@action.uses(db, auth)
def my_callback():
    if db(db.species).isempty():
        with open('species.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                db.species.insert(name=row[0])
    if db(db.sightings).isempty():
        with open('sightings.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                db.sightings.insert(name=row[0], bird_count=row[1])
    if db(db.checklist).isempty():
        with open('checklist.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                db.sightings.insert(name=row[0])

    return dict(my_value=3)
