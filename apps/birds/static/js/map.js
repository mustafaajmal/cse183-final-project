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


            drawing_coords: [],
            points: [],
            polygons: []
        };
    },
    methods: {

        getUserLocation: function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.setPosition, this.showLocationError);
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        },

        setPosition: function(position) {
            this.user_location = [position.coords.latitude, position.coords.longitude];
            L.marker(this.user_location).addTo(toRaw(this.map))
                .bindPopup("Current Location")
                .openPopup();
            this.map.setView(this.user_location, 13);
            this.map.once('moveend', this.loadHeatMap);
        },

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

        mapClickListener: function(e) {
            // Handle click
        },

        mapDblClickListener: function(e) {
            // Handle double click
            this.drawing_coords.push(e.latlng);
            console.log(this.drawing_coords);
            this.drawPoint(e.latlng);
            
        },

        drawPoint: function(e) {
            let point = L.circleMarker(e, { radius: 5, color: 'red' }).addTo(toRaw(this.map));
            this.points.push(point);
        },

        drawPolygon: function() {
            const convexHull = calculateConvexHull(this.drawing_coords);
            this.polygons.forEach(polygon => {
                this.map.removeLayer(polygon);
            });
            this.polygons = [];

            let polygon = L.polygon(convexHull).addTo(toRaw(this.map));
            this.polygons.push(polygon);
        },

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

        loadHeatMap: function() {
            var heat = L.heatLayer([
                [this.user_location[0], this.user_location[1], 1],
            ], {radius: 25, maxOpacity: 1}).addTo(toRaw(this.map));
            // First, get all events that are inside of the box
            
            // Then, loop through all events and record the sightings for each event
            // Each sighting will be of format species + count
            // Come up with a formula to denote intensity for a bird
            
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

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    // Do something here
}

app.load_data();

