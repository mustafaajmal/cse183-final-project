"use strict";

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


app.data = {    
    data: function() {
        return {
            // Complete as you see fit.
            my_value: 1, // This is an example.
            searchQuery: '',
            common_names: [], // This will hold the fetched common names.
        };
    },
    methods: {
        /*
        load_user_statistics: function() {
            let self = this;
            axios.get(get_user_statistics_url)
            .then(function (r) {
                const common_names = r.data.common_names
                console.log("Names", common_names)
                self.common_names = common_names
            });
        },
        */
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