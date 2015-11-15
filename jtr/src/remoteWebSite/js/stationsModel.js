/**
 * Created by tedshaffer on 11/7/15.
 */
define(function () {

    var stationsModel = Backbone.Model.extend({

        ServerInterface: null,

        setServerInterface: function(serverInterface) {
            this.ServerInterface = serverInterface;
        },

        urlRoot : '/getStations',

        stations: [],

        sync: function(method, model, options) {
            options = options || {};
            //options.url = "http://10.1.0.241:8080/getStations";
            //options.url = "http://192.168.2.8:8080/getStations";
            options.url = this.ServerInterface.getBaseUrl() + "getStations";
            Backbone.sync(method, model, options);
        },

        retrieveStations: function() {
            var self = this;

            return new Promise(function(resolve, reject) {

                self.fetch({
                    success: function (model, response, options) {
                        console.log("stations load was successful");

                        var numStations = Object.keys(model.attributes).length;
                        for (var stationId in model.attributes) {
                            if (model.attributes.hasOwnProperty(stationId)) {
                                model.stations[Number(stationId)] = model.get(stationId);
                            }
                        }

                        resolve();
                    }
                });
            });
        },

        getStations: function() {
            return this.stations;
        },

        getStationFromAtsc: function (atscMajor, atscMinor) {
            var foundStation = null;

            $.each(this.stations, function (stationIndex, station) {
                if (station.AtscMajor == atscMajor && station.AtscMinor == atscMinor) {
                    foundStation = station;
                    return;
                }
            });

            return foundStation;
        },


    });
    return stationsModel;
});
