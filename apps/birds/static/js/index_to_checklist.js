"use strict";
// This will be the object that will contain the Vue attributes
// and be used to initialize it.
function toRaw(obj) {
    return obj.__v_raw || obj;
}

let app = {};

app.data = {    
    data: function() {
        return {
            drawn_coordinates: drawn_coordinates || [],
            latitude: '',
            longitude: ''
        };
    },
    methods: {

    },

    computed: {

        latUpdate: function(){
            return this.latitude;
        },

        longUpdate: function() {
            return this.longitude;
        }
    },

    mounted() {
        console.log("This.drawn_coordinates", this.drawn_coordinates);
        if (this.drawn_coordinates.length > 0) {
            this.latitude = this.drawn_coordinates[0].lat.toFixed(6); // Update latitude in Vue app's data
            this.longitude = this.drawn_coordinates[0].lng.toFixed(6); // Update longitude in Vue app's data
        }

    }
};

app.vue = Vue.createApp(app.data).mount("#app");

app.load_data = function () {

}


app.load_data();

