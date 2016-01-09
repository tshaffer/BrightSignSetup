/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').controller('recordNow', ['$scope', '$http', 'jtrServerService', function($scope, $http, $jtrServerService) {

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

    $scope.invokeRecordNow = function() {

        console.log("invokeRecordNow");
        console.log("Title: " + $scope.title);
        console.log("Input source: " + $scope.inputSource);
        console.log("Channel: " + $scope.channel);

        $scope.recordNowParameters = {}
        $scope.recordNowParameters.title = $scope.getRecordingTitle("#title", new Date(), $scope.inputSource, $scope.channel);
        $scope.recordNowParameters.duration = $scope.duration;
        $scope.recordNowParameters.inputSource = $scope.inputSource;
        $scope.recordNowParameters.channel = $scope.channel;

        $jtrServerService.recordNow($scope.manualRecordingParameters);
    };

    $scope.name = 'Record Now';
    console.log($scope.name + " screen displayed");

    $scope.title = "";
    $scope.duration = "";
    $scope.inputSource = "tuner";
    $scope.channel = "5";

    $("#title").focus();
}]);
