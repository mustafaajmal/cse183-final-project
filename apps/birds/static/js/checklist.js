"use strict";

let app = {};

app.data = {    
    data: function() {
        return {
            my_value: 1,
            common_names: [],
            query: "",
            drawn_coordinates: drawn_coordinates,
        };
    },
    methods: {
        fetchSpecies() {
          // Fetch species data from the server
          fetch('/get_species')
            .then(response => response.json())
            .then(data => {
              // Update the speciesList data property with the fetched species data
              this.speciesList = data.species;
            })
            .catch(error => {
              console.error('Error fetching species:', error);
            });
        },
        search: function()  {
            let self = this;
            console.log("Search function called");
            console.log("query:", self.query);
            
            if (self.query.length >= 1){
                axios.post(search_url, {params: {q: self.query}})
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
                    console.log("All names are down");
                })
                .catch(function (error) {
                    console.error("Error fetching all names:", error);
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
            })
            .catch(function (error) {
                console.error("Error fetching observation dates:", error);
            });
        },
        increment: function(index) {
            // Functionality to increment number seen for a species
            this.common_names[index].numSeen++;
        },
        submitChecklist: function() {
            // Prepare checklist data to send to the server for processing
            const data = {
                checklist: this.common_names.map(name => {
                    return {
                        COMMON_NAME: name.COMMON_NAME,
                        OBSERVATION_DATE: name.observation_dates.length > 0 ? name.observation_dates[0].OBSERVATION_DATE : null, // Assuming you want to take the first observation date
                        // Add other checklist fields as needed
                    };
                })
            };

            // Send the checklist data to the server
            axios.post(submit_checklist_url, data)
            .then(response => {
                // Handle response from the server
                console.log('Checklist submitted successfully:', response);
            })
            .catch(error => {
                // Handle any errors that occur during submission
                console.error('Error submitting checklist:', error);
            });
        }
    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {
  axios.get(load_user_statistics_url)
  .then(function (response) {
      app.vue.common_names = response.data.common_names.map(name => {
          return {
              COMMON_NAME: name,
              numSeen: 0, // Assuming you want to start with zero seen for each species
              observation_dates: []
          };
      });
  })
  .catch(function (error) {
      console.error("Error loading data:", error);
  });
};


app.load_data();
