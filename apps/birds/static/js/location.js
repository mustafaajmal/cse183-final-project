"use strict";

let app = Vue.createApp({
    data() {
        return {
            regionData: [],
            filteredData: [],
            searchQuery: localStorage.getItem('region_search') || '',
            searchActive: false,
            selectedSpecies: null,
            totalChecklists: 0,
            totalSightings: 0,
            topContributors: [],
            chartInstance: null
        };
    },
    methods: {
        toggleSearch() {
            this.searchActive = this.searchQuery.trim() !== '';
            this.filteredData = this.searchActive ?
                this.regionData.filter(entry =>
                    entry.species.toLowerCase().startsWith(this.searchQuery.toLowerCase())
                ) : this.regionData;
            localStorage.setItem('region_search', this.searchQuery);
        },
        updateObservations(speciesId, newObservations) {
            axios.post(update_observations_url, { species_id: speciesId, new_observations: newObservations })
                .then(response => {
                    const speciesIndex = this.regionData.findIndex(species => species.id === speciesId);
                    if (speciesIndex !== -1) {
                        this.regionData[speciesIndex].total_observations = response.data.total_observations;
                    }
                })
                .catch(error => {
                    console.error('There was an error updating the observations:', error);
                });
        },
        handleKeyUp(event, species) {
            if (event.key === 'Enter') {
                this.updateObservations(species.id, species.new_observations);
            }
        },
        incrementObservations(species) {
            const newObservations = (species.new_observations || 0) + 1;
            this.updateObservations(species.id, newObservations);
        },
        loadData() {
            axios.get(load_region_data_url)
                .then(response => {
                    this.regionData = response.data.regionData.map(species => ({
                        id: species.id,
                        species: species.species,
                        total_observations: species.total_observations || 0,
                        new_observations: 0
                    }));
                    if (this.searchQuery.trim() !== '') {
                        this.toggleSearch();
                    }
                })
                .catch(error => {
                    console.error('There was an error fetching the region data:', error);
                });
        },
        fetchAndDisplaySpeciesData(speciesId) {
            axios.get(`/api/species_data/${speciesId}`)
                .then(response => {
                    const speciesData = response.data;
                    this.renderChart(speciesData.dates, speciesData.observations);
                })
                .catch(error => console.error('Error fetching species data:', error));
        },
        renderChart(dates, observations) {
            const ctx = this.$refs.chartCanvas.getContext('2d');
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }
            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Observations Over Time',
                        data: observations,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                }
            });
        }
    },
    mounted() {
        console.log("Vue mounted successfully.");
        this.loadData();
    }
}).mount("#location-app");
