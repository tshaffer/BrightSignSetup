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

            this.playRecordedShow = function(id) {
                console.log("playRecordedShow: " + id.toString());
            }

            this.deleteRecordedShow = function(id) {
                console.log("deleteRecordedShow: " + id.toString());
            }

            this.helpers({
                recordings: () => {
                    return Recordings.find({});
                }
            })
        }
    }
}]);
