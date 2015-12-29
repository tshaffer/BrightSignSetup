/**
 * Created by tedshaffer on 12/28/15.
 */
angular.module('jtr').directive('stations', function () {
    return {
        restrict: 'E',
        templateUrl: 'client/stations/stations.html',
        controllerAs: 'stations',
        controller: function ($scope, $reactive) {
            $reactive(this).attach($scope);

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
