/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('jtr').controller('cgRecordingOptionsDlg', function($scope, $uibModalInstance, modalTitle, startTimeIndex, stopTimeIndex) {

    $scope.startTimeOptions = ["15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late"];
    $scope.stopTimeOptions = ["30 minutes early", "15 minutes early", "10 minutes early", "5 minutes early", "On time", "5 minutes late", "10 minutes late", "15 minutes late", "30 minute late", "1 hour late", "1 1/2 hours late", "2 hours late", "3 hours late"];

    $scope.modalTitle = modalTitle;
    $scope.startTimeIndex = startTimeIndex;
    $scope.stopTimeIndex = stopTimeIndex;

    $scope.startTime = $scope.startTimeOptions[$scope.startTimeIndex];
    $scope.stopTime = $scope.stopTimeOptions[$scope.stopTimeIndex];

    $scope.ok = function () {
        args = {};
        args.startTimeIndex = $scope.startTimeIndex;
        args.stopTimeIndex = $scope.stopTimeIndex;
        $uibModalInstance.close(args);
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
        $scope.startTime = $scope.startTimeOptions[$scope.startTimeIndex];
    }

    $scope.displayStopTimeSetting = function () {
        $scope.stopTime = $scope.stopTimeOptions[$scope.stopTimeIndex];
    }

})
