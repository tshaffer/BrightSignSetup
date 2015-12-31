/**
 * Created by tedshaffer on 12/28/15.
 */
angular.module('jtr').config(function ($urlRouterProvider, $stateProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $stateProvider
        .state('recordings', {
            url: '/recordings',
            template: '<recordings></recordings>'
        })
        .state('manualrecord', {
            url: '/manualecord',
            template: '<manualrecord></manualrecord>'
        })
        .state('scheduledRecordings', {
            url: '/scheduledRecordings',
            template: '<scheduled-recordings></scheduled-recordings>'
        })
        .state('stations', {
            url: '/stations',
            template: '<stations></stations>'
        })
        .state('settings', {
            url: '/settings',
            template: '<settings></settings>'
        });

    $urlRouterProvider.otherwise("/recordings");
});