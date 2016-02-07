/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').controller('recordings', ['$scope', '$http', 'jtrServerService', 'jtrStationsService', 'jtrSettingsService', function ($scope, $http, $jtrServerService, $jtrStationsService, $jtrSettingsService) {

    $scope.playRecordedShow = function (id, relativeUrl, storageLocation) {
        console.log("playRecordedShow: " + id + ", " + relativeUrl);

        var commandData;

        commandData = {"command": "playRecordedShow", "recordingId": id, "relativeUrl": relativeUrl, "storageLocation": storageLocation};

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

    $scope.convertRecording = function (dbRecording) {

        var recording = {};

        recording.duration = dbRecording.Duration;
        recording.fileName = dbRecording.FileName;
        recording.hlsSegmentationComplete = dbRecording.HLSSegmentationComplete;
        recording.hlsUrl = dbRecording.HLSUrl;
        recording.lastViewedPosition = dbRecording.LastViewedPosition;
        recording.recordingId = dbRecording.RecordingId;
        recording.startDateTime = dbRecording.StartDateTime;
        recording.title = dbRecording.Title;
        recording.transcodeComplete = dbRecording.TranscodeComplete;
        recording.path = dbRecording.path;

        // IDs
        var recordingIdStr = recording.recordingId.toString();
        recording.playRecordingId = "recording" + recordingIdStr;
        recording.deleteRecordingId = "delete" + recordingIdStr;
        recording.repeatRecordingId = "repeat" + recordingIdStr;
        recording.streamRecordingId = "stream" + recordingIdStr;
        recording.infoRecordingId = "info" + recordingIdStr;

        // placeholder
        recording.relativeUrl = "";

        return recording;
    }

    $scope.show = function () {

        var recordingsByIdentifier = {};

        var getJtrRecordingsPromise = $jtrServerService.getRecordings();
        getJtrRecordingsPromise.then(function (result) {
            console.log("getRecordings success");

            // recordings are in result.data.recordings
            console.log("number of recordings is: " + result.data.recordings.length);

            $scope.recordings = [];

            //for (recording of result.data.recordings)
            for (var i = 0; i < result.data.recordings.length; i++) {

                var jtrRecording = result.data.recordings[i];
                var recording = $scope.convertRecording(jtrRecording);
                recording.storageLocation = "local";

                $scope.recordings.push(recording);

                var key = recording.title + "::" + recording.fileName;
                recordingsByIdentifier[key] = recording;
            }

            var getJtrConnectRecordingsPromise = $jtrServerService.getJtrConnectRecordings();
            getJtrConnectRecordingsPromise.then(function(result) {
                console.log("getJtrConnectRecordings success");

                for (var i = 0; i < result.data.recordings.length; i++) {

                    var jtrConnectRecording = result.data.recordings[i];
                    var recording = $scope.convertRecording(jtrConnectRecording);

                    // check to see if this recording matches a recording on the local jtr
                    var key = recording.title + "::" + recording.fileName;
                    if (key in recordingsByIdentifier) {
                        // recording exists both locally and on jtrConnect
                        var existingRecording = recordingsByIdentifier[key];
                        existingRecording.storageLocation = "both";
                        existingRecording.relativeUrl = jtrConnectRecording.RelativeUrl;
                    }
                    else {
                        recording.storageLocation = "server";
                        recording.relativeUrl = jtrConnectRecording.RelativeUrl;
                        $scope.recordings.push(recording);
                    }
                }
            }, function(reason) {
                console.log("getJtrConnectRecordings failure");
            }
            );
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

