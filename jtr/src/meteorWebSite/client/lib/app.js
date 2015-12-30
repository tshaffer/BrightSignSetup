/**
 * Created by tedshaffer on 12/28/15.
 */
angular.module('jtr', ['angular-meteor', 'ui.router']);

angular.module('jtr').service('$jtrStationsService', ['$http', function($http) {

    console.log("I am jtrStationsService");

    this.sayHello = function () {
        console.log("hello");
    }

    this.getStations = function() {
        return Stations.find({});
    }

    //this.settings = {};
    //this.settingsLoaded = false;
    //
    //this.getSettingsResult = function() {
    //    return this.settings;
    //}
    //
    //this.getSettings = function() {
    //
    //    var self = this;
    //
    //    if (this.settingsLoaded.length > 0) {
    //        var promise = new Promise(function(resolve, reject) {
    //            resolve();
    //        });
    //        return promise;
    //    }
    //    else {
    //        var promise = $jtrServerService.getSettings();
    //        promise.then(function(result) {
    //            self.settings = result.data;
    //        });
    //        return promise;
    //    }
    //};
    //
    //this.setSettings = function(settings) {
    //    var promise = $jtrServerService.setSettings(settings);
    //    return promise;
    //};
}]);

