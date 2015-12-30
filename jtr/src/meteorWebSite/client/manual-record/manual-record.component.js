/**
 * Created by tedshaffer on 12/30/15.
 */
angular.module('jtr').directive('manual-record', ['$jtrStationsService', function ($jtrStationsService) {
    return {
        restrict: 'E',
        templateUrl: 'client/manual-record/manual-record.html',
        controllerAs: 'manualRecordings',
        controller: function ($scope, $reactive) {
            $reactive(this).attach($scope);

            //this.numStations = 2;

            //this.getStationCount = function() {
            //    //return this.allStations.length;
            //    return 3;
            //}

            //this.stations = function() {
            //    return $jtrStationsService.getStations();
            //}
            this.helpers({
                stations: () => {

                    //$jtrStationsService.sayHello();
                    //
                    //return $jtrStationsService.getStations();
                    //return Stations.find({});

                    //var theStations = Stations.find({});
                    //
                    //this.allStations = [];
                    //
                    //var self = this;
                    //
                    //angular.forEach(theStations, function(station, stationIndex) {
                    //    self.allStations.push(station);
                    //});
                    //
                    //this.numStations = this.allStations.length;
                    //
                    //return this.allStations;
                },
            })
        }
    }
}]);
