"use strict";
// This will be the object that will contain the Vue attributes
// and be used to initialize it.
function toRaw(obj) {
    return obj.__v_raw || obj;
}

function calculateConvexHull(points) {
    // Clone the points array to avoid modifying the original array
    const clonedPoints = points.slice();
    
    // Sort points by x-coordinate (in case of tie, sort by y-coordinate)
    clonedPoints.sort((a, b) => {
        if (a.lat === b.lat) {
            return a.lng - b.lng;
        }
        return a.lat - b.lat;
    });

    // Define helper functions for cross product and cross product sign
    function crossProduct(p1, p2, p3) {
        return (p2.lat - p1.lat) * (p3.lng - p1.lng) - (p3.lat - p1.lat) * (p2.lng - p1.lng);
    }

    function crossProductSign(p1, p2, p3) {
        const value = crossProduct(p1, p2, p3);
        return value === 0 ? 0 : (value > 0 ? 1 : -1);
    }

    // Initialize lower and upper hull arrays
    const lowerHull = [];
    const upperHull = [];

    // Build lower hull
    for (const point of clonedPoints) {
        while (lowerHull.length >= 2 && crossProductSign(lowerHull[lowerHull.length - 2], lowerHull[lowerHull.length - 1], point) <= 0) {
            lowerHull.pop();
        }
        lowerHull.push(point);
    }

    // Build upper hull
    for (let i = clonedPoints.length - 1; i >= 0; i--) {
        const point = clonedPoints[i];
        while (upperHull.length >= 2 && crossProductSign(upperHull[upperHull.length - 2], upperHull[upperHull.length - 1], point) <= 0) {
            upperHull.pop();
        }
        upperHull.push(point);
    }

    // Remove duplicates and combine lower and upper hulls
    upperHull.pop();
    lowerHull.pop();
    return lowerHull.concat(upperHull);
}

let app = {};

app.data = {    
    data: function() {
        return {
            map: null,
            user_location: null,
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
        map.doubleClickZoom.disable();
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        this.map = map;
        this.getUserLocation();

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    // Do something here
}

app.load_data();

