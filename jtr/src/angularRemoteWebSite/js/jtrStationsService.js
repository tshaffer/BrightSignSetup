/**
 * Created by tedshaffer on 12/20/15.
 */
angular.module('myApp').service('jtrStationsService', ['jtrServerService', function($jtrServerService){

    this.stations = [];

    this.getStationsResult = function() {
        return this.stations;
    }

    this.getStations = function() {

        var self = this;

        if (self.stations.length > 0) {
            var promise = new Promise(function(resolve, reject) {
                console.log("create getStations promise");
                resolve();
            });
            return promise;
        }
        else {
            var promise = $jtrServerService.getStations();
            promise.then(function(result) {
                console.log("getStations value returned");
                self.stations = result.data;
            });
            return promise;
        }
    };

    this.getStationFromAtsc = function (atscMajor, atscMinor) {
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
    }

    this.getChannelFromStationIndex = function (stationId) {

        var channel = "";

        $.each(this.stations, function (index, station) {
            if (stationId == station.StationId) {
                channel = station.AtscMajor + "-" + station.AtscMinor;
                return false;
            }
        });

        return channel;
    }

    this.getStationFromId = function (stationId) {

        var selectedStation = "";

        // get stationIndex
        $.each(this.stations, function (stationIndex, station) {
            if (station.StationId == stationId) {
                selectedStation = station.AtscMajor + "." + station.AtscMinor;
                return false;
            }
        });

        return selectedStation;
    }

    this.getStationIndex = function (stationId) {

        var selectedStationIndex = -1;

        $.each(this.stations, function (stationIndex, station) {
            if (station.StationId == stationId) {
                selectedStationIndex = stationIndex;
                return false;
            }
        });

        return selectedStationIndex;
    }

    this.getStationIndexFromName = function (stationNumber) {

        var stationIndex = -1;

        var self = this;
        this.stations.forEach(function(station, index, stations) {
            if (self.stationNumbersEqual(stationNumber, station.AtscMajor.toString() + '-' + station.AtscMinor.toString())) {
                stationIndex = index;
                return false;
            }
        });

        return stationIndex;
    }

    this.stationNumbersEqual = function (stationNumber1, stationNumber2) {

        if (stationNumber1 == stationNumber2) return true;

        stationNumber1 = this.standardizeStationNumber(stationNumber1);
        stationNumber2 = this.standardizeStationNumber(stationNumber2);
        return (stationNumber1 == stationNumber2);
    }

    this.standardizeStationNumber = function (stationNumber) {

        stationNumber = stationNumber.replace(".1", "");
        stationNumber = stationNumber.replace("-1", "");
        stationNumber = stationNumber.replace("-", ".");

        return stationNumber;
    }
    
}]);
