/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').service('jtrServerService', ['$http', function($http){

    var self = this;

    this.baseUrl = "http://192.168.0.111:8080/";

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

    this.getEpgData = function() {

        var url = self.baseUrl + "getEpg";

        var epgStartDate = new Date().toString("yyyy-MM-dd");

        var promise = $http.get(url, {
            params: { startDate: epgStartDate }
        });
        return promise;
    };

    this.getStations = function() {

        var url = self.baseUrl + "getStations";

        var epgStartDate = new Date().toString("yyyy-MM-dd");

        var promise = $http.get(url, {});
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
}]);
