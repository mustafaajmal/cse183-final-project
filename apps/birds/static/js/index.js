"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

app.data = {
    data: function() {
        return {
            my_value: 1, // This is an example.
            common_names: [], // This will hold the fetched common names.
            query: "",
            region: null, // To hold the selected region coordinates
            speciesStatistics: [], // To hold the statistics data for the selected region
            top_contributors: [], // To hold the top contributors data
            chart: null // Chart.js instance
        };
    },
    methods: {
        search: function() {
            let self = this;
            console.log("Search function called");
            console.log("query:", self.query);

            if (self.query.length >= 1) {
                axios.post(search_url, { params: { q: self.query } })
                .then(function(r) {
                    self.common_names = r.data.common_names.map(name => {
                        name.observation_dates = [];
                        return name;
                    });
                    console.log("Common names updated:", self.common_names);
                })
                .catch(function(error) {
                    console.error("There was an error!", error);
                });
            } else {
                axios.get(load_user_statistics_url)
                .then(function (r) {
                    self.common_names = r.data.common_names;
                    console.log("All names are down", self.common_names);
                })
                .catch(function(error) {
                    console.error("There was an error loading user statistics!", error);
                });
            }
        },
        fetchObservationDates: function(name) {
            let self = this;
            console.log("Fetching observation for ", name.COMMON_NAME);
            axios.post(observation_dates_url, { common_name: name.COMMON_NAME })
            .then(function(r) {
                name.observation_dates = r.data.observation_dates;
                self.common_names = [...self.common_names];
                console.log("Observation dates updated for", name.COMMON_NAME);
            })
            .catch(function(error) {
                console.error("There was an error fetching observation dates!", error);
            });
        },
        fetchRegionStatistics: function() {
            let self = this;
            console.log("Fetching statistics for region", self.region);
            axios.post(fetch_statistics_url, { region: self.region })
            .then(function(r) {
                self.speciesStatistics = r.data.species_data;
                self.top_contributors = r.data.top_contributors;
                self.renderChart();
                console.log("Statistics fetched", self.speciesStatistics, self.top_contributors);
            })
            .catch(function(error) {
                console.error("There was an error fetching region statistics!", error);
            });
        },
        renderChart: function() {
            let self = this;
            let ctx = document.getElementById('speciesChart').getContext('2d');
            let labels = self.speciesStatistics.map(species => species.COMMON_NAME);
            let data = self.speciesStatistics.map(species => species.sightings);

            if (self.chart) {
                self.chart.destroy();
            }

            self.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Number of Sightings',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            console.log("Chart rendered");
        },
        initializeMap: function() {
            let self = this;
            self.map = L.map('map').setView([37.7749, -122.4194], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(self.map);

            self.drawing_polygon = L.polygon([], { color: 'red' }).addTo(self.map);

            self.map.on('dblclick', function(e) {
                // Clear existing polygon
                self.drawing_polygon.setLatLngs([]);
                self.region = [];
            });

            self.map.on('click', function(e) {
                if (!self.region) {
                    self.region = [];
                }
                self.region.push(e.latlng);
                self.drawing_polygon.setLatLngs(self.region);
                console.log("Region updated", self.region);
            });
        }
    },
    mounted: function() {
        console.log("Vue app mounted");
        this.search(); // Call the search method initially to load data.
        this.initializeMap(); // Initialize the map
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_user_statistics_url).then(function (r) {
        console.log(r.status);
        app.vue.common_names = r.data.common_names;
        console.log("Initial data loaded", app.vue.common_names);
    })
    .catch(function(error) {
        console.error("There was an error loading initial data!", error);
    });
}

app.load_data();
