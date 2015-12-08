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

        getChannelFromStationIndex: function (stationId) {

            var channel = "";

            $.each(this.stations, function (index, station) {
                if (stationId == station.StationId) {
                    channel = station.AtscMajor + "-" + station.AtscMinor;
                    return false;
                }
            });

            return channel;
        },

        getStationFromId: function (stationId) {

            var selectedStation = "";

            // get stationIndex
            $.each(this.stations, function (stationIndex, station) {
                if (station.StationId == stationId) {
                    selectedStation = station.AtscMajor + "." + station.AtscMinor;
                    return false;
                }
            });

            return selectedStation;
        },

        getStationIndex: function (stationId) {

            var selectedStationIndex = -1;

            $.each(this.stations, function (stationIndex, station) {
                if (station.StationId == stationId) {
                    selectedStationIndex = stationIndex;
                    return false;
                }
            });

            return selectedStationIndex;
        },

        getStationIndexFromName: function (stationNumber) {

            var stationIndex = -1;

            var self = this;
            this.stations.forEach(function(station, index, stations) {
                if (self.stationNumbersEqual(stationNumber, station.AtscMajor.toString() + '-' + station.AtscMinor.toString())) {
                    stationIndex = index;
                    return false;
                }
            });

            return stationIndex;
        },

        stationNumbersEqual: function (stationNumber1, stationNumber2) {

            if (stationNumber1 == stationNumber2) return true;

            stationNumber1 = this.standardizeStationNumber(stationNumber1);
            stationNumber2 = this.standardizeStationNumber(stationNumber2);
            return (stationNumber1 == stationNumber2);
        },

        standardizeStationNumber: function (stationNumber) {

            stationNumber = stationNumber.replace(".1", "");
            stationNumber = stationNumber.replace("-1", "");
            stationNumber = stationNumber.replace("-", ".");

            return stationNumber;
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
