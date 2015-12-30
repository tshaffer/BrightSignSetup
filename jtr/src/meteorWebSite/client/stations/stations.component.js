/**
 * Created by tedshaffer on 12/28/15.
 */
angular.module('jtr').directive('stations', ['$jtrStationsService', function ($jtrStationsService) {
    return {
        restrict: 'E',
        templateUrl: 'client/stations/stations.html',
        controllerAs: 'stationList',
        controller: function ($scope, $reactive) {
            $reactive(this).attach($scope);

            this.newStation = {};

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

                    $jtrStationsService.sayHello();

                    return $jtrStationsService.getStations();
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

                numStations: () => {
                    return 4;
                },

                stationCount: () => {
                    return 5;
                }
            })
            //this.newParty = {};
            //
            //this.helpers({
            //        parties: () => {
            //            return Parties.find({});
            //        }
            //    }
            //)
            //;
            //
            //this.addParty = () => {
            //    Parties.insert(this.newParty);
            //    this.newParty = {};
            //}
            //;
            //
            ////this.addParty = function() {
            ////    Parties.insert(this.newParty);
            ////    this.newParty = {};
            ////}.bind(this);
            //
            //this.removeParty = (party) => {
            //    Parties.remove({_id: party._id});
            //}
        }
    }
}]);