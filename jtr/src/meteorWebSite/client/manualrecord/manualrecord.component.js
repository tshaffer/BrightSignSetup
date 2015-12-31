/**
 * Created by tedshaffer on 12/30/15.
 */
angular.module('jtr').directive('manualrecord', ['$jtrStationsService', function ($jtrStationsService) {
    return {
        restrict: 'E',
        templateUrl: 'client/manualrecord/manualrecord.html',
        controllerAs: 'manualRecordings',
        controller: function ($scope, $reactive) {
            $reactive(this).attach($scope);

// initialize model variables
            this.date = new Date();
            var timeObj = new Date();
            this.time = timeObj.set({
                millisecond: 0,
                second: 0,
            });

            this.inputSource = "tuner";

// handlers
            this.showChannel = function() {
                return this.inputSource == "tuner";
            };

            this.getRecordingTitle = function (title, dateObj, inputSource, channel) {

                if (!title) {
                    title = 'MR ' + dateObj.getFullYear() + "-" + twoDigitFormat((dateObj.getMonth() + 1)) + "-" + twoDigitFormat(dateObj.getDate()) + " " + twoDigitFormat(dateObj.getHours()) + ":" + twoDigitFormat(dateObj.getMinutes());
                    if (this.inputSource == "tuner") {
                        title += " Channel " + channel;
                    } else if (this.inputSource == "tivo") {
                        title += " Tivo";
                    } else {
                        title += " Roku";
                    }
                }

                return title;
            };


            this.invokeManualRecord = function() {
                console.log("invoke manual record");
                console.log("title is " + this.title);

                var date = this.date;
                var time = this.time;

                date.clearTime();
                var dateObj = date.set({
                    millisecond: 0,
                    second: 0,
                    minute: time.getMinutes(),
                    hour: time.getHours()
                });

                // check to see if recording is in the past
                var dtEndOfRecording = new Date(dateObj).addMinutes(Number(this.duration));
                var now = new Date();

                var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
                if (millisecondsUntilEndOfRecording < 0) {
                    alert("Recording time is in the past - change the date/time and try again.");
                }

                this.manualRecordingParameters = {}
                this.manualRecordingParameters.title = this.getRecordingTitle(this.title, dateObj, this.inputSource, this.channel);
                this.manualRecordingParameters.dateTime = dateObj;
                this.manualRecordingParameters.duration = this.duration;
                this.manualRecordingParameters.endDateTime = dtEndOfRecording;
                this.manualRecordingParameters.inputSource = this.inputSource;
                this.manualRecordingParameters.channel = this.channel;
                if (this.inputSource == "tuner") {
                    this.manualRecordingParameters.stationName = "TBD";
                }
                else {
                    this.manualRecordingParameters.stationName = "";
                }
                this.manualRecordingParameters.scheduledSeriesRecordingId = -1;

                //$jtrServerService.manualRecording($scope.manualRecordingParameters);
                ScheduledRecordings.insert(this.manualRecordingParameters);

            };
        }
    }
}]);
