/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('myApp').service('jtrBroadcastService', function($rootScope){

    var self = this;

    this.broadcastMsg = function(message, args) {
        console.log("broadcast message: " + message);

        var broadcastData = {};
        broadcastData.message = message;
        broadcastData.args = args;

        $rootScope.$broadcast('handleBroadcast', broadcastData);
    };
});
