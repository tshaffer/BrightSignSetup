/**
 * Created by tedshaffer on 11/7/15.
 */
define(function () {

    var stationsModel = Backbone.Model.extend({

        urlRoot : '/getStations',

        stations: [],

        sync: function(method, model, options) {
            options = options || {};
            //options.url = "http://10.1.0.241:8080/getStations";
            options.url = "http://192.168.2.8:8080/getStations";
            Backbone.sync(method, model, options);
        },

        retrieveStations: function() {
            var self = this;
            this.fetch({
                success: function (model, response, options) {
                    console.log("stations load was successful");
                    // model.attributes is an array of objects; each object is a station object (AtscMajor, AtscMinor, CommonName, Name, StationId)
                    //model.stations = model.attributes;

                    var numStations = Object.keys(model.attributes).length;
                    for (var stationId in model.attributes) {
                        if (model.attributes.hasOwnProperty(stationId)) {
                            model.stations[Number(stationId)] = model.attributes[stationId];
                        }
                    }
                }
            });
        }
    });
    return stationsModel;
});
