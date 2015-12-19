/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('myApp').controller('cgRecordingsMgr', ['$scope', '$http', 'jtrServerService', 'jtrBroadcastService', '$uibModal', function($scope, $http, $jtrServerService, $jtrBroadcastService, $uibModal) {

    console.log("cgRecordingsMgr launched");

    $scope.$on('handleBroadcast', function(eventName, message) {
        console.log("handleBroadcast invoked, received message is: " + message);
    });


}]);

