/**
 * Created by tedshaffer on 12/13/15.
 */
angular.module('myApp').controller('recordNow', ['$scope', '$http', function($scope, $http) {

    $scope.name = 'Record Now';
    console.log($scope.name + " screen displayed");

}]);
