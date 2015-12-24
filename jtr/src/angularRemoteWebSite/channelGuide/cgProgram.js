/**
 * Created by tedshaffer on 12/25/15.
 */
angular.module('jtr').directive("cgProgram", function() {
    return {
        templateUrl: 'channelGuide/cgProgram.html',
        replace: true,
        link: function(scope, elements, attrs) {

            var durationInMinutes = Number(scope.program.durationInMinutes);

            var cssClasses = "";
            var width = 0;
            if (durationInMinutes == 30) {
                cssClasses = "thirtyMinuteButton";
            }
            else if (durationInMinutes == 60) {
                cssClasses = "sixtyMinuteButton";
            }
            else {
                cssClasses = "variableButton";
                width = (durationInMinutes / 30) * scope.widthOfThirtyMinutes;
            }

            elements[0].innerHTML = scope.program.title;
            $(elements).addClass(cssClasses);
            if (width != 0) {
                $(elements).css('width', width.toString() + "px");
            }

            var id = "show-" + scope.$parent.station.stationData.StationId + "-" + scope.program.indexIntoProgramList.toString();
            $(elements).attr("id",id);
        }
    }
})

