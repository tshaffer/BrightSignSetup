var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(['$routeProvider', function ($routeProvider) {

    $routeProvider

    .when('/', {
        templateUrl: 'screens/recordings.html',
        controller: 'recordingsController'
    })

    .when('/recordings', {
        templateUrl: 'screens/recordings.html',
        controller: 'recordingsController'
    })

    .when('/channelGuide', {
        templateUrl: 'screens/channelGuide.html',
        controller: 'channelGuideController'
    })

    .when('/scheduledRecordings', {
        templateUrl: 'screens/scheduledRecordings.html',
        controller: 'scheduledRecordingsController'
    })

    .when('/manualRecord', {
        templateUrl: 'screens/manualRecord.html',
        controller: 'manualRecordController'
    })

    .when('/recordNow', {
        templateUrl: 'screens/channelGuide.html',
        controller: 'recordNowController'
    })

    .when('/settings', {
        templateUrl: 'screens/settings.html',
        controller: 'settingsController'
    })
}]);

myApp.controller('FooterCtrl', ['$scope', '$log', function($scope, $log) {

    $scope.invokeHome = function() {
        console.log("home invoked");
    }

    $scope.invokeTrickMode = function(trickMode) {
        console.log("trickMode invoked: " + trickMode);
    };

    $scope.trickModes = [

        { command: "record", font: "glyphicon-record" },
        { command: "stop", font: "glyphicon-stop" },
        { command: "rewind", font: "glyphicon-backward" },
        { command: "instantReplay", font: "glyphicon-step-backward" },
        { command: "pause", font: "glyphicon-pause" },
        { command: "play", font: "glyphicon-play" },
        { command: "quickSkip", font: "glyphicon-step-forward" },
        { command: "fastForward", font: "glyphicon-forward" }
    ];

}]);

myApp.controller('recordingsController', ['$scope', '$log', function($scope, $log) {

    $scope.name = 'Recordings';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('channelGuideController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Channel Guide';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('scheduledRecordingsController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Scheduled Recordings';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('manualRecordController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Manual Record';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('recordNowController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Record Now';
    console.log($scope.name + " screen displayed");

}]);

myApp.controller('settingsController', ['$scope', '$log', '$routeParams', function($scope, $log, $routeParams) {

    $scope.name = 'Settings';
    console.log($scope.name + " screen displayed");

}]);

