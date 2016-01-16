/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('jtr').controller('footer', ['$scope', '$http', 'jtrServerService', function($scope, $http, $jtrServerService){

    $scope.invokeTrickMode = function(trickMode) {
        console.log("trickMode invoked: " + trickMode);

        var commandData = {
            "command": trickMode
        };

        var commandData = {"command": "remoteCommand", "value": trickMode};
        var promise = $jtrServerService.browserCommand(commandData);
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
