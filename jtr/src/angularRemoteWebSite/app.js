angular
    .module('jtr', ['ngRoute', 'ui.bootstrap'])

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

            var lastViewedPositionInMinutes = Math.floor(recording.lastViewedPosition / 60);
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





