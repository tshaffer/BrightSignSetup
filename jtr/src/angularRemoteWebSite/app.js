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

        var baseURL= "http://192.168.0.111:8080/";
        var aUrl = baseURL + "getRecordings";

        var promise = $http.get(aUrl, {});

        return promise;
    };

    $scope.browserCommand = function(commandData) {

        var baseURL= "http://192.168.0.111:8080/";
        var url = baseURL + "browserCommand";

        var promise = $http.get(url, {
            params: commandData
        });

        return promise;
    }


    $scope.playRecordedShow = function(id) {
        console.log("playRecordedShow: " + id);

        var commandData = { "command": "playRecordedShow", "recordingId": id };
        var promise = $scope.browserCommand(commandData);
        promise.then(function() {
            console.log("browserCommand successfully sent");
        })
    }

    $scope.deleteRecordedShow = function(id) {
        console.log("deleteRecordedShow: " + id);
    }

    $scope.repeatRecordedShow = function(id) {
        console.log("repeatRecordedShow: " + id);
    }

    $scope.streamRecordedShow = function(id) {
        console.log("streamRecordedShow: " + id);
    }

    $scope.infoRecordedShow = function(id) {
        console.log("infoRecordedShow: " + id);
    }

    console.log($scope.name + " screen displayed");

    $scope.name = 'Recordings';
    $scope.recordings = [];

    promise = $scope.getRecordings();
    promise.then(function(result) {
        console.log("getRecordings success");

        // recordings are in result.data.recordings
        console.log("number of recordings is: " +  result.data.recordings.length);

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

// implement the following in filters?

            // IDs
            var recordingIdStr = recording.recordingId.toString();
            recording.playRecordingId = "recording" + recordingIdStr;
            recording.deleteRecordingId = "delete" + recordingIdStr;
            recording.repeatRecordingId = "repeat" + recordingIdStr;
            recording.streamRecordingId = "stream" + recordingIdStr;
            recording.infoRecordingId = "info" + recordingIdStr;

            // RECORDING DATE
            var weekday = new Array(7);
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";

            var dt = recording.startDateTime;
            var n = dt.indexOf(".");
            var formattedDayDate;
            if (n >= 0) {
                var dtCompatible = dt.substring(0, n);
                var date = new Date(dtCompatible);
                formattedDayDate = weekday[date.getDay()] + " " + (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
            }
            else {
                formattedDayDate = "poop";
            }
            recording.startDateTime = formattedDayDate;

            // POSITION
            var lastViewedPositionInMinutes = Math.floor(recording.lastViewedPosition / 60);
            recording.position = lastViewedPositionInMinutes.toString() + " of " + recording.duration.toString() + " minutes";

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

myApp.controller('manualRecordController', ['$scope', '$log', '$routeParams', '$http', function($scope, $log, $routeParams, $http) {

    $scope.invokeManualRecord = function() {

        console.log("invokeManualRecord");
        console.log("Title: " + $scope.title);
        console.log("Duration: " + $scope.duration);
        console.log("Date: " + $scope.date);
        console.log("Time: " + $scope.time);
        console.log("Input source: " + $scope.inputSource);
        console.log("Channel: " + $scope.channel);

        // retrieve date/time from html elements and convert to a format that works on all devices
        var date = $scope.date;
        var time = $scope.time;

        date.clearTime();
        var dateObj = date.set({
            millisecond: 0,
            second: 0,
            minute: time.getMinutes(),
            hour: time.getHours()
        });

        var duration = $scope.duration;

        var inputSource = $scope.inputSource

        var channel = $scope.channel;

        //var title = this.getRecordingTitle("#manualRecordTitle", dateObj, inputSource, channel);
        var title = $scope.title;

        // check to see if recording is in the past
        //var dtEndOfRecording = addMinutes(dateObj, duration);
        var dtEndOfRecording = new Date(dateObj).addMinutes(duration);
        var now = new Date();

        var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
        if (millisecondsUntilEndOfRecording < 0) {
            alert("Recording time is in the past - change the date/time and try again.");
        }

        // this seems silly - should be a better way to do this
        $scope.manualRecordingParameters = {}
        $scope.manualRecordingParameters.title = title;
        $scope.manualRecordingParameters.dateTime = dateObj;
        $scope.manualRecordingParameters.duration = duration;
        $scope.manualRecordingParameters.inputSource = inputSource;
        $scope.manualRecordingParameters.channel = channel;

        var baseURL= "http://192.168.0.111:8080/";
        var url = baseURL + "manualRecording";

        var promise = $http.post(url, {
            params: $scope.manualRecordingParameters
        });

    };

    $scope.name = 'Manual Record';
    console.log($scope.name + " screen displayed");

    $scope.title = "";
    $scope.duration = "";

    var date = new Date();

    var dateVal = date.getFullYear() + "-" + twoDigitFormat((date.getMonth() + 1)) + "-" + twoDigitFormat(date.getDate());
    //$scope.date = dateVal;
    $scope.date = new Date();

    var timeVal = twoDigitFormat(date.getHours()) + ":" + twoDigitFormat(date.getMinutes());
    //$scope.time = timeVal;
    $scope.time = new Date();

    $scope.inputSource = "tuner";
    $scope.channel = "5";
}]);

myApp.controller('recordNowController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Record Now';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('settingsController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Settings';
    console.log($scope.name + " screen displayed");

}]);

