/**
 * Created by tedshaffer on 11/7/15.
 */
define(['serverInterface'], function (serverInterface) {

    console.log("creating stationsModel module");

    var StationsModel = Backbone.Model.extend({

        urlRoot : '/getStations',

        stations: [],

        sync: function(method, model, options) {
            options = options || {};
            options.url = serverInterface.getBaseUrl() + "getStations";
            Backbone.sync(method, model, options);
        },

        retrieveStations: function() {
            var self = this;

            return new Promise(function(resolve, reject) {

                self.fetch({
                    reset: true,
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

            if (typeof atscMinor == 'undefined') {
                atscMinor = '1';
            }

            $.each(this.stations, function (stationIndex, station) {
                if (station.AtscMajor == atscMajor && station.AtscMinor == atscMinor) {
                    foundStation = station;
                    return;
                }
            });

            return foundStation;
        },


    });

    return {
        instance: null,

        getInstance: function(){
            if(this.instance === null){
                console.log("stationsModel instantiation");
                this.instance = new StationsModel();
            }
            return this.instance;
        }
    };
});
