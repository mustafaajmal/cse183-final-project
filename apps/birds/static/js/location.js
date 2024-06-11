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
                topContributors: [
                    { name: 'John Doe', email: 'john@example.com' },
                    { name: 'Jane Smith', email: 'jane@example.com' },
                    { name: 'Richard Roe', email: 'richard@example.com' },
                    { name: 'John Doe', email: 'john@example.com' },
                    { name: 'Jane Smith', email: 'jane@example.com' },
                    { name: 'Richard Roe', email: 'richard@example.com' }
                ],
                totalChecklists: 26,
                totalSightings: 78,
                chartInstance: null,

                drawn_coordinates: drawn_coordinates || [],
                events_in_bounds: [],
                species_in_bounds: []
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
                        
                    })
                    .catch(error => console.error('Error fetching bird sightings', error))
                
                
            },
            fetchSpeciesData() {
                // Dummy data for the graph
                if (this.selectedSpecies === 1) {
                    this.graphData = [
                        { date: '2024-06-01', count: 5 },
                        { date: '2024-06-02', count: 10 },
                        { date: '2024-06-03', count: 7 }
                    ];
                } else if (this.selectedSpecies === 2) {
                    this.graphData = [
                        { date: '2024-06-01', count: 8 },
                        { date: '2024-06-02', count: 12 },
                        { date: '2024-06-03', count: 5 }
                    ];
                } else if (this.selectedSpecies === 3) {
                    this.graphData = [
                        { date: '2024-06-01', count: 6 },
                        { date: '2024-06-02', count: 8 },
                        { date: '2024-06-03', count: 4 }
                    ];
                } else if (this.selectedSpecies === 4) {
                    this.graphData = [
                        { date: '2024-06-01', count: 10 },
                        { date: '2024-06-02', count: 5 },
                        { date: '2024-06-03', count: 7 }
                    ];
                }
                this.drawGraph();
            },
            drawGraph() {
                const ctx = this.$refs.speciesGraph.getContext('2d');
                if (this.chartInstance) {
                    this.chartInstance.destroy();
                }
                this.chartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: this.graphData.map(data => data.date),
                        datasets: [{
                            label: 'Number of Birds Seen',
                            data: this.graphData.map(data => data.count),
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
            },
            selectSpecies(speciesId) {
                this.selectedSpecies = speciesId;
                this.fetchSpeciesData();
            }
        },

        watch: {
            selectedRegion(newVal, oldVal) {
                if (newVal !== oldVal) {
                    this.fetchRegionData();
                }
            },
            selectedSpecies(newVal, oldVal) {
                if (newVal !== oldVal) {
                    this.fetchSpeciesData();
                }
            }
        },

        computed: {
            eventsList: function() {
                return this.events_in_bounds;
            }
        },
        
        mounted() {
            // Fetch region data on mount
            this.fetchRegionData();
        }
    }).mount('#app');
});
