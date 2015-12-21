/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').controller('settings', ['$scope', 'jtrSettingsService', function($scope, $jtrSettingsService){

    $scope.name = 'Settings';
    console.log($scope.name + " screen displayed");

    //$scope.settings = {};

    $scope.recordingBitRateSet = function() {
        console.log("recordingBitRateSet invoked");

        $scope.settings.RecordingBitRate = Number($scope.recordingBitRateStr);

        $jtrSettingsService.setSettings($scope.settings);
    }

    $scope.segmentRecordingsSet = function() {
        console.log("segmentRecordingsSet invoked");
        if ($scope.segmentRecordingsOn) {
            $scope.settings.SegmentRecordings = 1;
        }
        else {
            $scope.settings.SegmentRecordings = 0;
        }

        $jtrSettingsService.setSettings($scope.settings);
    }

    $scope.settings = $jtrSettingsService.getSettingsResult();

    // RecordingBitRate
    // SegmentRecordings

    $scope.recordingBitRateStr = $scope.settings.RecordingBitRate.toString();
    if ($scope.settings.SegmentRecordings == 0) {
        $scope.segmentRecordingsOn = false;
    }
    else {
        $scope.segmentRecordingsOn = true;
    }

}]);

