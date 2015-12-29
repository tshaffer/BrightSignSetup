/**
 * Created by tedshaffer on 12/28/15.
 */
angular.module('jtr').directive('stations', function () {
    return {
        restrict: 'E',
        templateUrl: 'client/stations/stations.html',
        controllerAs: 'stationList',
        controller: function ($scope, $reactive) {
            $reactive(this).attach($scope);

            this.newStation = {};

            this.getStationCount = function() {
                //return this.allStations.length;
                return 2;
            }

            this.helpers({
                stations: () => {

                    return Stations.find({});

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
});
