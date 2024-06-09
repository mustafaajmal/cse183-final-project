"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
            common_names: [], // This will hold the fetched common names.
            query: "",
            search_option: "recent", // Default search option
        };
    },
    methods: {
        updateSearchOption: function() {
            let self = this
            if (self.search_option == "recent"){
                self.search_option = "old"
            } else{
                self.search_option = "recent"
            }
            console.log("changing option", self.search_option)
        },
        search: function()  {
            let self = this
            console.log("Search function called");
            console.log("query:", self.query)
            
            if (self.query.length >= 1){
                axios.post(search_url, {params: {q: self.query,  option: self.search_option}})
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
                .then(function (r){
                    self.common_names = r.data.common_names;
                    console.log("All names are down")
                })
            }
        },
        fetchObservationDates: function(name) {
            let self = this;
            console.log("Fetching observation for ", name.COMMON_NAME);
            axios.post(observation_dates_url, {common_name: name.COMMON_NAME})
            .then(function(r) {
                name.observation_dates = r.data.observation_dates;
                self.common_names = [...self.common_names];
            })
        }

        initializeMap: function() {
            // Initialize the map
            this.map = L.map('map').setView([lat, len], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);
        },
        showCoordinatesOnMap: function(lat, lng) {
            if (this.map) {
                // Clear existing markers
                this.markers.forEach(marker => this.map.removeLayer(marker));
                this.markers = [];

                // Add new marker
                let marker = L.marker([lat, lng]).addTo(this.map);
                this.markers.push(marker);

                // Center the map on the new marker
                this.map.setView([lat, lng], 13);
            }
        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
    axios.get(load_user_statistics_url).then(function (r) {
        console.log(r.status);
        app.vue.common_names = r.data.common_names;
        
    });
}

app.load_data();