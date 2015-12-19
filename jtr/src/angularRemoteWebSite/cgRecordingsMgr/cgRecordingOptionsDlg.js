/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('myApp').controller('cgRecordingOptionsDlg', function($scope, $uibModalInstance, modalTitle) {

    $scope.modalTitle = modalTitle;
    //$scope.items = items;
    //$scope.selected = {
    //    item: $scope.items[0]
    //};

    $scope.stopTimeOptions = ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"];
    $scope.stopTimeOffsets = [-30, -15, -10, -5, 0, 5, 10, 15, 30, 60, 90, 120, 180];

    $scope.stopTimeOnTimeIndex = 4;
    $scope.stopTimeIndex = 4;

    $scope.startTimeOptions = ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"];
    $scope.startTimeOffsets = [-15, -10, -5, 0, 5, 10, 15];

    $scope.startTimeOnTimeIndex = 3;
    $scope.startTimeIndex = 3;

    $scope.startTime = "On time";
    $scope.stopTime = "On time";

    $scope.ok = function () {
        $uibModalInstance.close($scope.selected.item);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.cgRecordOptionsNextEarlyStartTime = function() {
        console.log("recordOptionsNextEarlyStartTime invoked");
        if ($scope.startTimeIndex > 0) {
            $scope.startTimeIndex--;
            $scope.displayStartTimeSetting();
        }
    }

    $scope.cgRecordOptionsNextLateStartTime = function() {
        console.log("cgRecordOptionsNextLateStartTime invoked");
        if ($scope.startTimeIndex < ($scope.startTimeOptions.length-1)) {
            $scope.startTimeIndex++;
            $scope.displayStartTimeSetting();
        }
    }

    $scope.cgRecordOptionsNextEarlyStopTime = function() {
        console.log("cgRecordOptionsNextEarlyStopTime invoked");
        if ($scope.stopTimeIndex > 0) {
            $scope.stopTimeIndex--;
            $scope.displayStopTimeSetting();
        }
    }

    $scope.cgRecordOptionsNextLateStopTime = function() {
        console.log("cgRecordOptionsNextLateStopTime invoked");
        if ($scope.stopTimeIndex < ($scope.stopTimeOptions.length-1)) {
            $scope.stopTimeIndex++;
            $scope.displayStopTimeSetting();
        }
    }

    $scope.displayStartTimeSetting = function () {
        //$("#cgRecordOptionsStartTimeLabel")[0].innerHTML = $scope.startTimeOptions[$scope.startTimeIndex];
        $scope.startTime = $scope.startTimeOptions[$scope.startTimeIndex];
    }

    $scope.displayStopTimeSetting = function () {
        //$("#cgRecordOptionsStopTimeLabel")[0].innerHTML = $scope.stopTimeOptions[$scope.stopTimeIndex];
        $scope.stopTime = $scope.stopTimeOptions[$scope.stopTimeIndex];
    }

})
