/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').service('jtrServerService', ['$http', function($http){

    var self = this;

    this.baseUrl = "http://192.168.0.105:8080/";
    //this.baseUrl = "http://10.1.0.241:8080/";

    this.lastTunedChannelResult = null;

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
            var url = self.baseUrl + "getStations";
            var promise = $http.get(url, {});
            promise.then(function(result) {
                console.log("getStations value returned");
                self.stations = result.data;
            });
            return promise;
        }
    };

    this.browserCommand = function(commandData) {

        var url = self.baseUrl + "browserCommand";

        var promise = $http.get(url, {
            params: commandData
        });
        return promise;
    };

    this.getRecordings = function() {

        var aUrl = self.baseUrl + "getRecordings";

        var promise = $http.get(aUrl, {});
        return promise;
    };

    this.getScheduledRecordings = function(currentDateTime) {

        var url = self.baseUrl + "scheduledRecordings";

        var promise = $http.get(url, {
            params: currentDateTime
        });
        return promise;
    };

    this.getEpgData = function() {

        var url = self.baseUrl + "getEpg";

        var epgStartDate = new Date().toString("yyyy-MM-dd");

        var promise = $http.get(url, {
            params: { startDate: epgStartDate }
        });
        return promise;
    };

    this.manualRecording = function(manualRecordingParameters) {

        var url = self.baseUrl + "manualRecording";

        var promise = $http.post(url, {
            params: manualRecordingParameters
        });
        return promise;
    };

    this.recordNow = function(recordNowParameters) {

        var url = self.baseUrl + "manualRecording";

        var promise = $http.post(url, {
            params: recordNowParameters
        });
        return promise;
    };

    this.retrieveLastTunedChannel =  function() {

        var url = this.baseUrl + "lastTunedChannel";

        var promise = $http.get(url, {});
        return promise;
    };

}]);
