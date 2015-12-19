/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('myApp').controller('cgRecordingsMgr', ['$scope', '$http', 'jtrServerService', 'jtrBroadcastService', '$uibModal', function($scope, $http, $jtrServerService, $jtrBroadcastService, $uibModal) {

    console.log("cgRecordingsMgr launched");

    $scope.$on('handleBroadcast', function(eventName, broadcastEventData) {
        console.log("handleBroadcast invoked, received data is: " + broadcastEventData);

        if (broadcastEventData.message == "cgRecordings") {
            $scope.show(broadcastEventData.args);
        }
    });

    $scope.show = function(programData) {
        console.log("cgRecordingsMgr.show invoked");
    }
}]);

