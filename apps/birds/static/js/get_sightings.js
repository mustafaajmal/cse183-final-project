function get_sightings(rectangle_coordinates){
    let p1 = rectangle_coordinates[0];
    let p2 = rectangle_coordinates[1];
    
    let north = max(p1['lat'], p2['lat']);
    let south = min(p1['lat'], p2['lat']);

    let west = min(p1['lng'], p2['lng']);
    let east = max(p1['lng'], p2['lng']);

    map_bounds = {
        north: north,
        south: south,
        west: west,
        east: east

    }
    events_in_bounds = [];
    species_in_bounds = [];

    axios.post(get_sightings_url, map_bounds)
        .then(response => {
            events_in_bounds = response.data.sightings;
            species_in_bounds = [...new Set(events_in_bounds.map(event => event.species))];
            species_in_bounds.sort((a, b) => a.localeCompare(b));
        })
        .catch(error => console.error('Error fetching bird sightings', error))

    return {
        events: events_in_bounds,
        species: species_in_bounds
    };
}