/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').controller('scheduledRecordings', ['$scope', '$http', 'jtrServerService', 'jtrStationsService', function($scope, $http, $jtrServerService, $jtrStationsService){

    $scope.invokeScheduledRecordingAction = function(action, recordingId) {

        if (action == "stop") {
            $jtrServerService.stopActiveRecording(recordingId);
        }
        else if (action == "delete") {
            $jtrServerService.deleteScheduledRecording(recordingId);
        }
        $scope.show();
    }

    $scope.show = function() {
        var currentDateTimeIso = new Date().toISOString();
        var currentDateTime = {"currentDateTime": currentDateTimeIso};

        promise = $jtrServerService.getScheduledRecordings(currentDateTime);
        promise.then(function (result) {
            console.log("getScheduledRecordings success");

            // scheduledRecordings are in result.data?
            console.log("number of scheduled recordings is: " + result.data.length);

            $scope.scheduledRecordings = [];

            for (var i = 0; i < result.data.length; i++) {

                var jtrScheduledRecording = result.data[i];

                scheduledRecording = {};
                scheduledRecording.dateTime = jtrScheduledRecording.DateTime;
                scheduledRecording.duration = jtrScheduledRecording.Duration;
                scheduledRecording.endDateTime = jtrScheduledRecording.EndDateTime;
                scheduledRecording.recordingId = jtrScheduledRecording.Id;
                scheduledRecording.inputSource = jtrScheduledRecording.InputSource;
                scheduledRecording.recordingBitRate = jtrScheduledRecording.RecordingBitRate;
                scheduledRecording.scheduledSeriesRecordingId = jtrScheduledRecording.ScheduledSeriesRecordingId;
                scheduledRecording.segmentRecording = jtrScheduledRecording.SegmentRecording;
                scheduledRecording.startTimeOffset = jtrScheduledRecording.StartTimeOffset;
                scheduledRecording.startTimeOffset = jtrScheduledRecording.StopTimeOffset;
                scheduledRecording.title = jtrScheduledRecording.Title;
                scheduledRecording.channel = jtrScheduledRecording.Channel;

                var currentDateTime = new Date();
                var date = new Date(scheduledRecording.dateTime);
                var endDateTime = new Date(scheduledRecording.endDateTime);

                var clickAction = "delete";
                icon = 'glyphicon-remove';
                if (date <= currentDateTime && currentDateTime < endDateTime) {
                    clickAction = "stop";
                    icon = 'glyphicon-stop';
                }

                var channelParts = scheduledRecording.channel.split('-');
                var station = $jtrStationsService.getStationFromAtsc(channelParts[0], channelParts[1]);
                var stationName = "TBD";
                if (station != null) {
                    stationName = station.CommonName;
                }
                scheduledRecording.stationName = stationName;

                scheduledRecording.icon = icon;
                scheduledRecording.action = clickAction;

                $scope.scheduledRecordings.push(scheduledRecording);
            }

            return;
        }, function (reason) {
            console.log("getRecordings failure");
        });
    };

    $scope.name = 'Scheduled Recordings';
    console.log($scope.name + " screen displayed");

    $scope.show();

}])
