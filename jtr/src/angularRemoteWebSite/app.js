var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function ($routeProvider) {

    $routeProvider

    .when('/', {
        templateUrl: 'screens/recordings.html',
        controller: 'recordingsController'
    })

    .when('/recordings', {
        templateUrl: 'screens/recordings.html',
        controller: 'recordingsController'
    })

    .when('/channelGuide', {
        templateUrl: 'screens/channelGuide.html',
        controller: 'channelGuideController'
    })

    .when('/scheduledRecordings', {
        templateUrl: 'screens/scheduledRecordings.html',
        controller: 'scheduledRecordingsController'
    })

    .when('/manualRecord', {
        templateUrl: 'screens/manualRecord.html',
        controller: 'manualRecordController'
    })

    .when('/recordNow', {
        templateUrl: 'screens/channelGuide.html',
        controller: 'recordNowController'
    })

    .when('/settings', {
        templateUrl: 'screens/settings.html',
        controller: 'settingsController'
    })
}]);

myApp.controller('FooterCtrl', ['$scope', '$log', function($scope, $log) {

    $scope.invokeHome = function() {
        console.log("home invoked");
    }

    $scope.invokeTrickMode = function(trickMode) {
        console.log("trickMode invoked: " + trickMode);
    };

    $scope.trickModes = [

        { command: "record", font: "glyphicon-record" },
        { command: "stop", font: "glyphicon-stop" },
        { command: "rewind", font: "glyphicon-backward" },
        { command: "instantReplay", font: "glyphicon-step-backward" },
        { command: "pause", font: "glyphicon-pause" },
        { command: "play", font: "glyphicon-play" },
        { command: "quickSkip", font: "glyphicon-step-forward" },
        { command: "fastForward", font: "glyphicon-forward" }
    ];

}]);

myApp.controller('recordingsController', ['$scope', '$log', '$http', function($scope, $log, $http) {

    $scope.getRecordings = function() {

        var baseURL= "http://192.168.0.101:8080/";
        var aUrl = baseURL + "getRecordings";

        var promise = $http.get(aUrl, {
        });

        return promise;
    };

    console.log($scope.name + " screen displayed");

    $scope.name = 'Recordings';
    $scope.recordings = [];

    promise = $scope.getRecordings();
    promise.then(function(result) {
        console.log("getRecordings success");

        // recordings are in result.data.recordings
        console.log("number of recordings is: " +  result.data.recordings.length);

        //recordingId: -1,
        //title: '',
        //startDateTime: '',
        //duration: 0,
        //fileName: '',
        //lastViewedPosition: 0,
        //transcodeComplete: 0,
        //hlsSegmentationComplete: 0,
        //hlsUrl: ''

        $scope.recordings = [];

        //for (recording of result.data.recordings)
        for (var i = 0; i < result.data.recordings.length; i++) {
            var jtrRecording = result.data.recordings[i];

            recording = {};
            recording.duration = jtrRecording.Duration;
            recording.fileName = jtrRecording.FileName;
            recording.hlsSegmentationComplete = jtrRecording.HLSSegmentationComplete;
            recording.hlsUrl = jtrRecording.HLSUrl;
            recording.lastViewedPosition = jtrRecording.LastViewedPosition;
            recording.recordingId = jtrRecording.RecordingId;
            recording.startDateTime = jtrRecording.StartDateTime;
            recording.title = jtrRecording.Title;
            recording.transcodeComplete = jtrRecording.TranscodeComplete;
            recording.path = jtrRecording.path;

            $scope.recordings.push(recording);
        }

        return;
    }, function(reason) {
        console.log("getRecordings failure");
    });
}]);

myApp.controller('channelGuideController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Channel Guide';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('scheduledRecordingsController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Scheduled Recordings';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('manualRecordController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Manual Record';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('recordNowController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Record Now';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('settingsController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Settings';
    console.log($scope.name + " screen displayed");

}]);

