/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').controller('manualRecord', ['$scope', '$http', 'jtrServerService', function($scope, $http, $jtrServerService) {

    $scope.showChannel = function() {
        return $scope.inputSource == "tuner";
    };

    $scope.getRecordingTitle = function (titleId, dateObj, inputSource, channel) {

        var title = $scope.title;
        if (!title) {
            title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
            if ($scope.inputSource == "tuner") {
                title += " Channel " + channel;
            } else if ($scope.inputSource == "tivo") {
                title += " Tivo";
            } else {
                title += " Roku";
            }
        }

        return title;
    };

    $scope.invokeManualRecord = function() {

        console.log("invokeManualRecord");
        console.log("Title: " + $scope.title);
        console.log("Duration: " + $scope.duration);
        console.log("Date: " + $scope.date);
        console.log("Time: " + $scope.time);
        console.log("Input source: " + $scope.inputSource);
        console.log("Channel: " + $scope.channel);

        var date = $scope.date;
        var time = $scope.time;

        date.clearTime();
        var dateObj = date.set({
            millisecond: 0,
            second: 0,
            minute: time.getMinutes(),
            hour: time.getHours()
        });

        // check to see if recording is in the past
        var dtEndOfRecording = new Date(dateObj).addMinutes($scope.duration);
        var now = new Date();

        var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
        if (millisecondsUntilEndOfRecording < 0) {
            alert("Recording time is in the past - change the date/time and try again.");
        }

        $scope.manualRecordingParameters = {}
        $scope.manualRecordingParameters.title = $scope.getRecordingTitle("#manualRecordTitle", dateObj, $scope.inputSource, $scope.channel);
        $scope.manualRecordingParameters.dateTime = dateObj;
        $scope.manualRecordingParameters.duration = $scope.duration;
        $scope.manualRecordingParameters.inputSource = $scope.inputSource;
        $scope.manualRecordingParameters.channel = $scope.channel;

        $jtrServerService.manualRecording($scope.manualRecordingParameters);
     };

    $scope.name = 'Manual Record';
    console.log($scope.name + " screen displayed");

    $scope.title = "";
    $scope.duration = "";

    date = new Date();
    $scope.date = date;
    $scope.time = new Date(2015, 0, 1, date.getHours(), date.getMinutes(), 0);

    $scope.hstep = 1;
    $scope.mstep = 1;

    $scope.ismeridian = true;
    $scope.toggleMode = function() {
        $scope.ismeridian = ! $scope.ismeridian;
    };

    $scope.changed = function () {
        console.log('Time changed to: ' + $scope.time);
    };

    $scope.inputSource = "tuner";
    $scope.channel = "5";

    $("#manualRecordTitle").focus();

}]);

