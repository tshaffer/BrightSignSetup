/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').controller('recordings', ['$scope', '$http', 'jtrServerService', 'jtrStationsService', 'jtrSettingsService', function ($scope, $http, $jtrServerService, $jtrStationsService, $jtrSettingsService) {

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

        var promise = $jtrServerService.getJtrConnectRecordings();
        promise.then(function(result) {
           console.log("getJtrConnectRecordings success");
        });

        return;

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

                // IDs
                var recordingIdStr = recording.recordingId.toString();
                recording.playRecordingId = "recording" + recordingIdStr;
                recording.deleteRecordingId = "delete" + recordingIdStr;
                recording.repeatRecordingId = "repeat" + recordingIdStr;
                recording.streamRecordingId = "stream" + recordingIdStr;
                recording.infoRecordingId = "info" + recordingIdStr;

                $scope.recordings.push(recording);
            }

            return;
        }, function (reason) {
            console.log("getRecordings failure");
        })
    };

    var getStationsPromise = $jtrStationsService.getStations();
    var getSettingsPromise = $jtrSettingsService.getSettings();
    Promise.all([getStationsPromise, getSettingsPromise]).then(function () {
        $scope.show();
    });
}
])
;

