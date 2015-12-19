angular
    .module('myApp', ['ngRoute', 'ui.bootstrap'])

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

    //angular.module('myApp').controller('cgRecording', function($scope, $uibModalInstance, items) {
    //
    //        //$scope.items = items;
    //        $scope.selected = {
    //            //item: $scope.items[0]
    //        };
    //
    //        $scope.ok = function () {
    //            $uibModalInstance.close($scope.selected.item);
    //        };
    //
    //        $scope.cancel = function () {
    //            $uibModalInstance.dismiss('cancel');
    //        };
    //})




