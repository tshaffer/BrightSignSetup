/**
 * Created by tedshaffer on 12/30/15.
 */
angular.module('jtr').directive('recordings', ['$jtrStationsService', '$jtrServerService', function ($jtrStationsService, $jtrServerService) {
    return {
        restrict: 'E',
        templateUrl: 'client/recordings/recordings.html',
        controllerAs: 'recordingsList',
        controller: function ($scope, $reactive) {
            $reactive(this).attach($scope);

            console.log("I am recordings");

            this.playRecordedShow = function(id) {

                console.log("playRecordedShow: " + id.toString());

                console.log("playRecordedShow: " + id);

                var commandData = {"command": "playRecordedShow", "recordingId": id};
                var promise = $jtrServerService.browserCommand(commandData);
                promise.then(function () {
                    console.log("browserCommand successfully sent");
                })
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
