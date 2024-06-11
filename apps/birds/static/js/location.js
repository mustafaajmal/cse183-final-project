function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const app = Vue.createApp({
        data() {
            return {
                selectedRegion: 1, // Simulating a selected region
                selectedSpecies: null,
                speciesData: [
                    { id: 1, name: 'Blue Jay', checklists: 5, sightings: 15 },
                    { id: 2, name: 'Carolina Wren', checklists: 8, sightings: 25 },
                    { id: 3, name: 'House Sparrow', checklists: 6, sightings: 18 },
                    { id: 4, name: 'Red-winged Blackbird', checklists: 7, sightings: 20 },
                    { id: 4, name: 'Red-winged Blackbird', checklists: 7, sightings: 20 }
                ],
                graphData: [],
                topContributors: {},

                totalChecklists: 0,
                totalSightings: 0,
                chartInstance: null,

                drawn_coordinates: drawn_coordinates || [],
                events_in_bounds: [],
                species_in_bounds: [],
            };
        },
        methods: {

            fetchRegionData() {
                // Dummy data is already set in the data properties
                let p1 = drawn_coordinates[0];
                let p2 = drawn_coordinates[1];
                
                let north = Math.max(p1['lat'], p2['lat']);
                let south = Math.min(p1['lat'], p2['lat']);

                let west = Math.min(p1['lng'], p2['lng']);
                let east = Math.max(p1['lng'], p2['lng']);

                map_bounds = {
                    north: north,
                    south: south,
                    west: west,
                    east: east
                }

                console.log(north, south, east, west);

                axios.post(get_bird_sightings_url, map_bounds)
                    .then(response => {
                        this.events_in_bounds = response.data.sightings;
                        console.log("Response.data.sightings:", response.data.sightings);
                        this.species_in_bounds = [...new Set(this.events_in_bounds.map(event => event.species))];
                        this.species_in_bounds.sort((a, b) => a.localeCompare(b));

                        // Loop through events in bounds, if observer id is new in dictionary, add it with intensity
                        // Else add to existing observer

                        for (let i = 0; i < this.events_in_bounds.length; i++){
                            observer_id = this.events_in_bounds[i].obs_id;
                            count = this.events_in_bounds[i].intensity;
                            // console.log("Observer Id", observer_id, "Count", count);
                            if (this.topContributors.hasOwnProperty(observer_id)) {
                                // If it exists, add the count to the existing value
                                this.topContributors[observer_id] += count;
                            } else {
                                // If it does not exist, set the initial count
                                this.topContributors[observer_id] = count;
                            }
                        }

                        let sortedContributors = Object.entries(this.topContributors).sort((a, b) => b[1] - a[1]);
                        this.topContributors = Object.fromEntries(sortedContributors);

                        console.log("Top Contributors", this.topContributors);
                        
                    })
                    .catch(error => console.error('Error fetching bird sightings', error))
                
                
            },
            fetchSpeciesData() {
                // Dummy data for the graph
                console.log("Selected Species", this.selectedSpecies);
                for (let i = 0; i < this.events_in_bounds.length; i++){
                    species = this.events_in_bounds[i].species;
                    date = this.events_in_bounds[i].date;
                    count = this.events_in_bounds[i].intensity;
                    if (species === this.selectedSpecies){
                        if (this.graphData.hasOwnProperty(date)){
                            this.graphData[date] += count;
                        } else {
                            this.graphData[date] = count;
                        }
                    }
                }
                console.log(this.graphData);
                this.debouncedDrawGraph();
            },
            drawGraph() {
                // Transform the graphData from object to array format
                const transformedData = Object.keys(this.graphData).map(date => ({
                    date: date,
                    count: this.graphData[date]
                })).sort((a, b) => new Date(a.date) - new Date(b.date));
            
                // Extract labels and data for the chart
                const labels = transformedData.map(data => data.date);
                const data = transformedData.map(data => data.count);
            
                this.$nextTick(() => {
                    const ctx = this.$refs.speciesGraph.getContext('2d');
                    if (this.chartInstance) {
                        this.chartInstance.destroy();
                    }
                    this.chartInstance = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Number of Birds Seen',
                                data: data,
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                borderColor: 'rgba(54, 162, 235, 1)',
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
                });
            },
            
            selectSpecies(speciesId) {
                this.selectedSpecies = speciesId;
                this.fetchSpeciesData();
            }
        },

        computed: {
            eventsList: function() {
                return this.events_in_bounds;
            },

            contributorsList: function() {
                return this.topContributors;
            }
        },

        mounted() {
            // Fetch region data on mount
            this.fetchRegionData();
        },

        created() {
            this.debouncedDrawGraph = debounce(this.drawGraph, 300);
        }
    }).mount('#app');
});
