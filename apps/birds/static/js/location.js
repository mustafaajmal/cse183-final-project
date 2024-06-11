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
                chartInstance: null
            };
        },
        methods: {
            fetchRegionData() {
                // Dummy data is already set in the data properties
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
        mounted() {
            // Fetch region data on mount
            this.fetchRegionData();
        }
    }).mount('#app');
});
