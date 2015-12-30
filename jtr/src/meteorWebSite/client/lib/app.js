/**
 * Created by tedshaffer on 12/28/15.
 */
angular.module('jtr', ['angular-meteor', 'ui.router']);

angular.module('jtr').controller('$NavsCtrl', function($scope, $location){

    console.log("NavsCtrl");

    $scope.navs = [
        { link : '#/recordings', label : 'Recordings'},
        { link : '#/channelGuide', label : 'Channel Guide'},
        { link : '#/scheduledRecordings', label : 'Scheduled Recordings'},
        { link : '#/manualRecord', label : 'Manual Record'},
        { link : '#/recordNow', label : 'Record Now'},
        { link : '#/settings', label : 'Settings'}
    ];

    $scope.selectedNav = $scope.navs[0];
    $scope.setSelectedNav = function(nav) {
        $scope.selectedNav = nav;
    }

    $scope.navClass = function(nav) {
        if ($scope.selectedNav == nav) {
            return "active";
        } else {
            return "";
        }
    }
});

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

