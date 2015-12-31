/**
 * Created by tedshaffer on 12/28/15.
 */
function twoDigitFormat(val) {
    val = '' + val;
    if (val.length === 1) {
        val = '0' + val.slice(-2);
    }
    return val;
}

angular.module('jtr', ['angular-meteor', 'ui.router']);

angular.module('jtr').controller('$NavsCtrl', function($scope, $location){

    console.log("NavsCtrl");

    $scope.navs = [
        { state: 'recordings', label : 'Recordings'},
        { state: 'channelGuide', label : 'Channel Guide'},
        { state: 'scheduledRecordings', label : 'Scheduled Recordings'},
        { state: 'manualrecord', label : 'Manual Record'},
        { state: 'recordNow', label : 'Record Now'},
        { state: 'settings', label : 'Settings'}
    ];

    $scope.selectedNav = $scope.navs[0];
    $scope.setSelectedNav = function(nav) {
        $scope.selectedNav = nav;
    }

    $scope.navClass = function(nav) {
        if ($scope.selectedNav == nav) {
            return "active";
        } else {
            return "";
        }
    }
});

angular.module('jtr').filter('formatScheduledRecordingDayOfWeek', function() {

    return function(dateTime) {

        var weekday = new Array(7);
        weekday[0] = "Sun";
        weekday[1] = "Mon";
        weekday[2] = "Tue";
        weekday[3] = "Wed";
        weekday[4] = "Thu";
        weekday[5] = "Fri";
        weekday[6] = "Sat";

        var date = new Date(dateTime);

        return weekday[date.getDay()];
    }
})

angular.module('jtr').filter('formatScheduledRecordingIcon', function() {

        return function(startDT, endDT) {

            var currentDateTime = new Date();
            var startDateTime = new Date(startDT);
            var endDateTime = new Date(endDT);

            var icon = 'glyphicon-remove';
            if (startDateTime <= currentDateTime && currentDateTime < endDateTime) {
                icon = 'glyphicon-stop';
            }

            return icon;
        }
    })
angular.module('jtr').filter('formatScheduledRecordingMonthDay', function() {

        return function(dateTime) {

            var date = new Date(dateTime);
            return (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
        }
    })

angular.module('jtr').filter('formatScheduledRecordingChannel', function() {

        return function(channel) {

            return channel;
            //var channelParts = channel.split('-');
            //if (channelParts.length == 2 && channelParts[1] == "1") {
            //    channel = channelParts[0];
            //}
            //return channel;
        }
    })

angular.module('jtr').filter('formatScheduledRecordingTimeOfDay', function() {

        return function(dateTime) {

            var date = new Date(dateTime);

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

            return hoursLbl + ":" + minutesLbl + amPM;
        }
    })

angular.module('jtr').filter('formatStartDateTime', function() {
        return function(startDateTime) {

            var weekday = new Array(7);
            weekday[0] = "Sun";
            weekday[1] = "Mon";
            weekday[2] = "Tue";
            weekday[3] = "Wed";
            weekday[4] = "Thu";
            weekday[5] = "Fri";
            weekday[6] = "Sat";

            var dt = startDateTime;
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
            return formattedDayDate;
        };
    })

angular.module('jtr').filter('formatPosition', function() {
        return function(lastViewedPosition, duration) {

            var lastViewedPositionInMinutes = Math.floor(recording.lastViewedPosition / 60);
            var position = lastViewedPositionInMinutes.toString() + " of " + duration.toString() + " minutes";

            return position;
        };
    })

angular.module('jtr').service('$jtrStationsService', ['$http', function($http) {

    console.log("I am jtrStationsService");

    this.sayHello = function () {
        console.log("hello");
    }

    this.getStations = function() {
        return Stations.find({});
    }

    //this.settings = {};
    //this.settingsLoaded = false;
    //
    //this.getSettingsResult = function() {
    //    return this.settings;
    //}
    //
    //this.getSettings = function() {
    //
    //    var self = this;
    //
    //    if (this.settingsLoaded.length > 0) {
    //        var promise = new Promise(function(resolve, reject) {
    //            resolve();
    //        });
    //        return promise;
    //    }
    //    else {
    //        var promise = $jtrServerService.getSettings();
    //        promise.then(function(result) {
    //            self.settings = result.data;
    //        });
    //        return promise;
    //    }
    //};
    //
    //this.setSettings = function(settings) {
    //    var promise = $jtrServerService.setSettings(settings);
    //    return promise;
    //};
}]);

