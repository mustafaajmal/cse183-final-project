"use strict";

let app = {};

app.data = {
    data: function() {
        return {
            query: '',
            speciesList: [],
            filteredSpecies: [],
        };
    },
    methods: {
        loadSpecies: function() {
            let self = this;
            axios.get(load_species_url).then(response => {
                self.speciesList = response.data.species.map(species => {
                    species.numSeen = 0; // Replace with DB value observation_count
                    return species;
                });
                self.filteredSpecies = self.speciesList;
            });
        },
        search: function() {
            let self = this;
            if (self.query) {
                self.filteredSpecies = self.speciesList.filter(species =>
                    species.COMMON_NAME.toLowerCase().includes(self.query.toLowerCase())
                );
            } else {
                self.filteredSpecies = self.speciesList;
            }
        },
        increment: function(index) {
            this.filteredSpecies[index].numSeen++;
        },
        submitChecklist: function() {
            let self = this;
            axios.post(submit_checklist_url, { checklist: self.filteredSpecies }).then(response => {
                alert('Checklist submitted successfully!');
            }).catch(error => {
                console.error('Error submitting checklist:', error);
            });
        }
    },
    mounted() {
        this.loadSpecies();
    }
};

app.vue = Vue.createApp(app.data).mount("#app");
