/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').controller('scheduledRecordings', ['$scope', '$http', 'jtrServerService', 'jtrStationsService', function($scope, $http, $jtrServerService, $jtrStationsService){

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
                scheduledRecording.channel = jtrScheduledRecording.Channel;
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

                // implement the following in filters?
                /*
                 Delete / Stop icon
                 DayOfWeek
                 Date
                 Time
                 Channel
                 Station Name
                 Title
                 */

                var weekday = new Array(7);
                weekday[0] = "Sun";
                weekday[1] = "Mon";
                weekday[2] = "Tue";
                weekday[3] = "Wed";
                weekday[4] = "Thu";
                weekday[5] = "Fri";
                weekday[6] = "Sat";

                var currentDateTime = new Date();
                var date = new Date(scheduledRecording.dateTime);
                var endDateTime = new Date(scheduledRecording.endDateTime);

                var clickAction = "delete";
                icon = 'glyphicon-remove';
                if (date <= currentDateTime && currentDateTime < endDateTime) {
                    clickAction = "stop";
                    icon = 'glyphicon-stop';
                }

                var dayOfWeek = weekday[date.getDay()];

                var monthDay = (date.getMonth() + 1).toString() + "/" + date.getDate().toString();

                var amPM = "am";

                var numHours = date.getHours();
                if (numHours == 0) {
                    numHours = 12;
                }
                else if (numHours > 12) {
                    numHours -= 12;
                    amPM = "pm";
                }
                else if (numHours == 12) {
                    amPM = "pm";
                }
                var hoursLbl = numHours.toString();

                //if (hoursLbl.length == 1) hoursLbl = "&nbsp" + hoursLbl;
                //if (hoursLbl.length == 1) hoursLbl = hoursLbl;

                var minutesLbl = twoDigitFormat(date.getMinutes().toString());

                var timeOfDay = hoursLbl + ":" + minutesLbl + amPM;

                var channel = scheduledRecording.channel;
                var channelParts = channel.split('-');
                if (channelParts.length == 2 && channelParts[1] == "1") {
                    channel = channelParts[0];
                }

                var station = $jtrStationsService.getStationFromAtsc(channelParts[0], channelParts[1]);
                var stationName = "TBD";
                if (station != null) {
                    stationName = station.CommonName;
                }

                var scheduledRecordingAttributes = {};
                scheduledRecording.dayOfWeek = dayOfWeek;
                scheduledRecording.monthDay = monthDay;
                scheduledRecording.timeOfDay = timeOfDay;
                scheduledRecording.channel = channel;
                scheduledRecording.stationName = stationName;
                //scheduledRecording.recordingId = clickAction + id;
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
