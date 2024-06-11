"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let statsApp = {};

statsApp.data = {
    data: function() {
        return {
            my_value: 1, 
            common_names: [], 
            query: "",
            search_option: "recent", 
        };
    },
    methods: {
        updateSearchOption: function() {
            let self = this;
            if (self.search_option == "recent") {
                self.search_option = "old";
            } else {
                self.search_option = "recent";
            }
            console.log("changing option", self.search_option);
        },
        search: function() {
            let self = this;
            console.log("Search function called");
            console.log("query:", self.query);

            if (self.query.length >= 1) {
                axios.post(search_url, {params: {q: self.query, option: self.search_option}})
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
                    console.log("All names are down");
                });
            }
        },
        fetchObservationDates: function(name) {
            let self = this;
            console.log("Fetching observation for ", name.COMMON_NAME);
            axios.post(observation_dates_url, {common_name: name.COMMON_NAME})
            .then(function(r) {
                name.observation_dates = r.data.observation_dates;
                self.common_names = [...self.common_names];
                console.log("Observation dates:", name.observation_dates);
            });
        },
        moveMapToObservation: function(name, date = null) {
            let self = this;
            let payload = {common_name: name.COMMON_NAME};
            if (date) {
                payload.observation_date = date.OBSERVATION_DATE;
            }
            axios.post(observation_dates_url, payload)
            .then(function(r) {
                const mostRecentSighting = r.data.most_recent_sighting;
                console.log("Most recent sighting:", mostRecentSighting);
                if (mostRecentSighting && mostRecentSighting.LATITUDE && mostRecentSighting.LONGITUDE) {
                    window.map.setView([mostRecentSighting.LATITUDE, mostRecentSighting.LONGITUDE], 13);
                    L.marker([mostRecentSighting.LATITUDE, mostRecentSighting.LONGITUDE]).addTo(window.map)
                      .bindPopup(name.COMMON_NAME)
                      .openPopup();
                } else {
                    console.error("Invalid location data:", mostRecentSighting);
                }
            })
            .catch(function(error) {
                console.error("Error fetching most recent sighting:", error);
            });
        }
    },
};

statsApp.vue = Vue.createApp(statsApp.data).mount("#statistics-app");

statsApp.load_data = function() {
    axios.get(load_user_statistics_url).then(function(r) {
        console.log(r.status);
        statsApp.vue.common_names = r.data.common_names;
    });
};

statsApp.load_data();
