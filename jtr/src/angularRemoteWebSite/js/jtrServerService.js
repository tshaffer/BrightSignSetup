/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').service('jtrServerService', ['$http', function($http){

    var self = this;

    var baseURL = document.baseURI.replace("?", "");
    if (baseURL.indexOf("localhost") >= 0) {
        this.baseUrl = "http://192.168.0.101:8080/";
    }
    else
    {
        this.baseUrl = document.baseURI.substr(0, document.baseURI.lastIndexOf(":")) + ":8080/";
    }

    //this.baseUrl = "http://192.168.0.109:8080/";

    this.lastTunedChannelResult = null;

    this.browserCommand = function(commandData) {

        var url = self.baseUrl + "browserCommand";

        var promise = $http.get(url, {
            params: commandData
        });
        return promise;
    };

    this.getSettings = function() {

        var url = self.baseUrl + "getSettings";

        var promise = $http.get(url, {});
        return promise;
    };

    this.setSettings = function(settings) {

        var url = self.baseUrl + "setSettings";

        var promise = $http.get(url, {
            params: settings
        });
        return promise;
    };

    this.getStations = function() {

        var url = self.baseUrl + "getStations";

        var promise = $http.get(url, {});
        return promise;
    };


    this.getRecordings = function() {

        var url = self.baseUrl + "getRecordings";

        var promise = $http.get(url, {});
        return promise;
    };

    this.getScheduledRecordings = function(currentDateTime) {

        var url = self.baseUrl + "scheduledRecordings";

        var promise = $http.get(url, {
            params: currentDateTime
        });
        return promise;
    };

    this.deleteScheduledRecording = function (scheduledRecordingId) {

        var url = self.baseURL + "deleteScheduledRecording";
        var commandData = { "scheduledRecordingId": scheduledRecordingId };

        var promise = $http.get(url, {
            params: commandData
        });
        return promise;
    };

    this.deleteScheduledSeries = function (scheduledSeriesRecordingId) {

        var url = self.baseUrl + "deleteScheduledSeries";
        var commandData = {"scheduledSeriesRecordingId": scheduledSeriesRecordingId};

        var promise = $http.get(url, {
            params: commandData
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

    this.deleteScheduledRecording = function (scheduledRecordingId) {

        var url = this.baseUrl + "deleteScheduledRecording";
        var commandData = { "scheduledRecordingId": scheduledRecordingId };
        var promise = $http.get(url, {
            params: commandData
        });
        return promise;
    },

    this.stopActiveRecording = function (scheduledRecordingId) {

        var url = this.baseUrl + "stopRecording";
        var commandData = { "scheduledRecordingId": scheduledRecordingId };
        var promise = $http.get(url, {
            params: commandData
        });
        return promise;
    }

}]);
