angular
    .module('jtr', ['ngRoute', 'ui.bootstrap'])

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

angular.module('jtr').controller('NavsCtrl', function($scope, $location){

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
});





