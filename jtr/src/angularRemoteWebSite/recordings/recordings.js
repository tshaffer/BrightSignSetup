/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').controller('recordings', ['$scope', '$http', 'jtrServerService', function ($scope, $http, $jtrServerService) {

    $scope.playRecordedShow = function (id) {
        console.log("playRecordedShow: " + id);

        var commandData = {"command": "playRecordedShow", "recordingId": id};
        var promise = $jtrServerService.browserCommand(commandData);
        promise.then(function () {
            console.log("browserCommand successfully sent");
        })
    }

    $scope.deleteRecordedShow = function (id) {

        console.log("deleteRecordedShow: " + id);
        var commandData = {"command": "deleteRecordedShow", "recordingId": id};
        var promise = $jtrServerService.browserCommand(commandData);
        promise.then(function () {
            console.log("browserCommand successfully sent");
            $scope.show();
        })
    }

    $scope.repeatRecordedShow = function (id) {
        console.log("repeatRecordedShow: " + id);
    }

    $scope.streamRecordedShow = function (id) {
        console.log("streamRecordedShow: " + id);
    }

    $scope.infoRecordedShow = function (id) {
        console.log("infoRecordedShow: " + id);
    }

    $scope.name = 'Recordings';
    $scope.recordings = [];

    $scope.show = function () {

        promise = $jtrServerService.getRecordings();
        promise.then(function (result) {
            console.log("getRecordings success");

            // recordings are in result.data.recordings
            console.log("number of recordings is: " + result.data.recordings.length);

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
        }, function (reason) {
            console.log("getRecordings failure");
        })
    };

    $scope.show();

}
])
;

