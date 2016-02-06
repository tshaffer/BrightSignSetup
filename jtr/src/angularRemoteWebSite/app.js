angular
    .module('jtr', ['ngRoute', 'ui.bootstrap'])

    .filter('formatScheduledRecordingDayOfWeek', function() {

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

    .filter('formatScheduledRecordingIcon', function() {

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

    .filter('formatScheduledRecordingMonthDay', function() {

        return function(dateTime) {

            var date = new Date(dateTime);
            return (date.getMonth() + 1).toString() + "/" + date.getDate().toString();
        }
    })

    .filter('formatScheduledRecordingChannel', function() {

        return function(channel) {

            var channelParts = channel.split('-');
            if (channelParts.length == 2 && channelParts[1] == "1") {
                channel = channelParts[0];
            }
            return channel;
        }
    })

    .filter('formatScheduledRecordingTimeOfDay', function() {

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

    .filter('formatStartDateTime', function() {
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

    .filter('formatPosition', function() {
        return function(lastViewedPosition, duration) {

            var lastViewedPositionInMinutes = Math.floor(lastViewedPosition / 60);
            var position = lastViewedPositionInMinutes.toString() + " of " + duration.toString() + " minutes";

            return position;
        };
    })

    .controller('NavsCtrl', function($scope, $location){

        $scope.navs = [
            { link : '#/recordings', label : 'Recordings'},
            { link : '#/channelGuide', label : 'Channel Guide'},
            { link : '#/scheduledRecordings', label : 'Scheduled Recordings'},
            { link : '#/manualRecord', label : 'Manual Record'},
            { link : '#/recordNow', label : 'Record Now'},
            { link : '#/settings', label : 'Settings'}
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
    })

    .config(['$routeProvider', function ($routeProvider) {

        $routeProvider

        .when('/', {
            templateUrl: 'recordings/recordings.html',
            controller: 'recordings'
        })

        .when('/recordings', {
            templateUrl: 'recordings/recordings.html',
            controller: 'recordings'
        })

        .when('/channelGuide', {
            templateUrl: 'channelGuide/channelGuide.html',
            controller: 'channelGuide'
        })

        .when('/scheduledRecordings', {
            templateUrl: 'scheduledRecordings/scheduledRecordings.html',
            controller: 'scheduledRecordings'
        })

        .when('/manualRecord', {
            templateUrl: 'manualRecord/manualRecord.html',
            controller: 'manualRecord'
        })

        .when('/recordNow', {
            templateUrl: 'recordNow/recordNow.html',
            controller: 'recordNow'
        })

        .when('/settings', {
            templateUrl: 'settings/settings.html',
            controller: 'settings'
        })
    }]
);





