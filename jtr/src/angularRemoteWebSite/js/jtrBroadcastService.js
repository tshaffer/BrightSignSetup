/**
 * Created by tedshaffer on 12/19/15.
 */
angular.module('myApp').service('jtrBroadcastService', function($rootScope){

    var self = this;

    this.broadcastMsg = function(message) {
        console.log("broadcast message: " + message);
        $rootScope.$broadcast('handleBroadcast', message);
    };
});
