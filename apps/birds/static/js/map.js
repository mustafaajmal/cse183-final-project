"use strict";
// This will be the object that will contain the Vue attributes
// and be used to initialize it.
function toRaw(obj) {
    return obj.__v_raw || obj;
}

let app = {};

app.data = {    
    data: function() {
        return {
            map: null,
            map_bounds: [],
            user_location: null,

            events_in_bounds: [],
            species_in_bounds: [],
            selectedSpecies: '',
            defaultDropdown: '',

            drawing_coords: [],
            points: [],
            polygons: [],

            heatmapLayer: null,
            debounceTimer: null,

            loading: false,
            tooltipVisible: {}
        };
    },
    methods: {

        // Prompts user for location
        getUserLocation: function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.setPosition, this.showLocationError);
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        },

        // Sets position of map to position [lat, long]
        // Also enables heatMap loading on map-moveend
        setPosition: function(position) {
            this.user_location = [position.coords.latitude, position.coords.longitude];
            this.map.setView(this.user_location, 15);
            this.map.on('moveend', this.loadHeatMap);
        },

        // Debugger if location could not be found
        showLocationError: function(error) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    alert("User denied the request for Geolocation.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    alert("Location information is unavailable.");
                    break;
                case error.TIMEOUT:
                    alert("The request to get user location timed out.");
                    break;
                case error.UNKNOWN_ERROR:
                    alert("An unknown error occurred.");
                    break;
            }
        },

        // Double Click event listener for map
        // When user double clicks, drawn a point and store it to this.drawing_coords
        mapDblClickListener: function(e) {
            // Handle double click
            if (this.drawing_coords.length === 2) {
                alert("CANNOT ADD MORE POINTS");
            } else {
                this.drawing_coords.push(e.latlng);
                console.log(this.drawing_coords);
                this.drawPoint(e.latlng);
            }
        },

        // Drawing the point on the map
        drawPoint: function(e) {
            let point = L.circleMarker(e, { radius: 5, color: 'red' }).addTo(toRaw(this.map));
            this.points.push(point);
        },

        // Connecting points together and building largest polygon
        drawPolygon: function() {
            // const convexHull = calculateConvexHull(this.drawing_coords);
            this.polygons.forEach(polygon => {
                this.map.removeLayer(polygon);
            });
            this.polygons = [];

            let polygon = L.rectangle(this.drawing_coords).addTo(toRaw(this.map));
            this.polygons.push(polygon);

            axios.post(save_coords_url, {drawing_coords: this.drawing_coords})
                .then(response => {
                    console.log('Coordinates saved successfully.');
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        },

        // Clears points list and clears polygon
        clearPolygon: function() {
            this.points.forEach(point => {
                this.map.removeLayer(point);
            });
            this.polygons.forEach(polygon => {
                this.map.removeLayer(polygon);
            });
            this.polygons = [];
            this.points = [];
            this.drawing_coords = [];

        },
        
        // Handles fetching data of map frame from database and loading heatmap
        // Disables movement of map data is loading
        loadHeatMap: function() {

            // First, get all events that are inside of the box
            console.log("Loading Heatmap");

            this.loading = true;


            let bounds = this.map.getBounds();
            this.map_bounds = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            };

            let speciesFilter = this.selectedSpecies === this.defaultDropdown ? '' : this.selectedSpecies;

            console.log("Species Filter: ", speciesFilter);
            
            axios.post(get_bird_sightings_url, this.map_bounds)
                .then(response => {
                    this.events_in_bounds = response.data.sightings;
                    // console.log("Response received:", response.data);
                    this.species_in_bounds = [...new Set(this.events_in_bounds.map(event => event.species))];
                    this.species_in_bounds.sort((a, b) => a.localeCompare(b));
                    this.defaultDropdown = 'All Species ' + "(" + this.species_in_bounds.length + ")"
                    this.species_in_bounds.unshift(this.defaultDropdown);

                    let filterActive = false;

                    if (speciesFilter != ''){
                        // Then it is an actual filter
                        if (!this.species_in_bounds.includes(speciesFilter)){
                            this.selectedSpecies = this.defaultDropdown;
                            filterActive = false;
                        } else {
                            this.selectedSpecies = speciesFilter;
                            filterActive = true;
                        }
                    } else {
                        this.selectedSpecies = this.defaultDropdown;
                        filterActive = false;
                    }

                    if (this.heatmapLayer) {
                        this.map.removeLayer(this.heatmapLayer);
                    }
                    let filteredSightings = this.events_in_bounds;

                    if (filterActive){
                        filteredSightings = this.events_in_bounds.filter(sighting => sighting.species === this.selectedSpecies);
                    }

                    let heatmapData = filteredSightings.map(sighting => [
                        sighting.lat, sighting.lon, sighting.intensity
                    ]);

                    this.heatmapLayer = L.heatLayer(heatmapData, {
                        radius: 25,
                        maxOpacity: 1
                    }).addTo(toRaw(this.map));

                    
                    console.log("Successfully Loaded Heatmap");
                    this.loading = false;
                })
                .catch(error => console.error('Error fetching bird sightings', error))
            // this.map('moveend', this.loadHeatMap());
        },

        showToolTip: function(event, tooltipId) {
            // Toggle the visibility of the specified tooltip
            Object.keys(this.tooltipVisible).forEach(id => {
                if (id !== tooltipId){
                    delete this.tooltipVisible[id];
                }
            });

            if (this.tooltipVisible[tooltipId]) {
                delete this.tooltipVisible[tooltipId];
            } else {
                this.tooltipVisible = { ...this.tooltipVisible, [tooltipId]: true };

                // Adjust the position of the tooltip
                this.$nextTick(() => {
                    let tooltip = document.getElementById(tooltipId);
                    if (tooltip) {
                        tooltip.style.display = 'block';
                        let iconRect = event.currentTarget.getBoundingClientRect();
                        tooltip.style.left = `${iconRect.left + 25}px`;
                        
                        let maxTranslatePercentage = -70;
                        let maxTooltipWidth = 200;
                        let tooltipWidth = tooltip.offsetWidth;
                        let percentage = maxTranslatePercentage * (1 - Math.log(tooltipWidth + 1) / Math.log(maxTooltipWidth + 1));
                        console.log(percentage);
                        console.log(tooltipWidth);
                        tooltip.style.transform = `translateY(${maxTranslatePercentage - percentage}%)`;
                        
                    }
                });
            }
        },

        hideTooltip: function(event) {
            if (!event.target.closest('.tooltip-content') && !event.target.closest('.info-icon')) {
                this.tooltipVisible = {}; // Hide all tooltips
            }
        },

        handleWindowResize() {
            this.tooltipVisible = {};
        },

    },

    computed: {
        filteredSpeciesList: function() {
            return this.species_in_bounds;
        }
    },

    mounted() {
        // index.html Mount()

        const map = this.map = L.map('map', {
            center: [0, 0],
            zoom: 15
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        map.on('click', this.mapClickListener);
        map.on('dblclick', this.mapDblClickListener);
        map.on('moveend', function() {
            this.map_bounds = map.getBounds();
            console.log(" North: " + map.getBounds().getNorth() + " South: " + map.getBounds().getSouth() + " East: " + map.getBounds().getEast() + " West: " + map.getBounds().getWest())
            
        });

        map.doubleClickZoom.disable();

        map.whenReady(() => {
            this.getUserLocation();
        });

        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        this.map = map;
        document.addEventListener('click', this.hideTooltip);
        window.addEventListener('resize', this.handleWindowResize);

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    // Do something here
}

app.load_data();

