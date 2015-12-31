/**
 * Created by tedshaffer on 12/30/15.
 */
angular.module('jtr').directive('recordings', ['$jtrStationsService', function ($jtrStationsService) {
    return {
        restrict: 'E',
        templateUrl: 'client/recordings/recordings.html',
        controllerAs: 'recordingsList',
        controller: function ($scope, $reactive) {
            $reactive(this).attach($scope);

            console.log("I am recordings");

            this.helpers({
                recordings: () => {
                    return Recordings.find({});
                }
            })
        }
    }
}]);
