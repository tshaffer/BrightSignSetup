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

            this.invokeManualRecord = function() {
                console.log("invoke manual record");
                console.log("title is " + this.title);

                var date = this.date;
                var time = this.time;

                var dateTime = date.clearTime();
                dateTime.set( {hour: time.getHours(), minute: time.getMinutes(), second: 0, millisecond: 0 } );

                //var dateTimeStr = dateTime.toString();
                //var dateTimeStr = date + " " + time;

                // required for iOS devices - http://stackoverflow.com/questions/13363673/javascript-date-is-invalid-on-ios
                //var compatibleDateTimeStr = dateTimeStr.replace(/-/g, '/');
                //var dateObj = new Date(compatibleDateTimeStr);

                var duration = this.duration;
                var inputSource = this.inputSource;
                var channel = this.channel;
//]               var title = this.getRecordingTitle("#manualRecordTitle", dateObj, inputSource, channel);
                var title = this.title;

                // check to see if recording is in the past
                //var dtEndOfRecording = addMinutes(dateObj, duration);
                //var dtEndOfRecording = new Date(dateObj).addMinutes(Number(duration));
                var dtEndOfRecording = dateTime.addMinutes(Number(duration));
                var now = new Date();

                var millisecondsUntilEndOfRecording = dtEndOfRecording - now;
                if (millisecondsUntilEndOfRecording < 0) {
                    alert("Recording time is in the past - change the date/time and try again.");
                    return false;
                }

                this.model.set('title', title);
                this.model.set('dateTime', dateObj);
                this.model.set('duration', duration);
                this.model.set('inputSource', inputSource);
                this.model.set('channel', channel);
                this.model.set('scheduledSeriesRecordingId', -1);

            };
        }
    }
}]);
